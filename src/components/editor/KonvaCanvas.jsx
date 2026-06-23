import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import { LayerRenderer } from './LayerRenderer';
import { measureText } from '../../utils/fonts';
import { Copy, Trash2, Lock, Unlock } from 'lucide-react';

export const KonvaCanvas = ({
  layers,
  selectedId,
  onSelect,
  onChangeLayer,
  onDeleteLayer,
  onDuplicateLayer,
  scale = 1,
  canvasConfig,
  stageRef: externalStageRef,
  fontTick = 0,
}) => {
  // Use the parent-provided ref when given (for PNG export / AI live preview),
  // otherwise fall back to a local ref for internal transformer logic.
  const internalStageRef = useRef(null);
  const stageRef = externalStageRef || internalStageRef;
  const transformerRef = useRef(null);

  // Double-click inline text editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [textareaStyle, setTextareaStyle] = useState({});

  // Canva-style selected layer and quick-action toolbar position state
  const selectedLayer = layers.find((l) => l.id === selectedId);
  const [toolbarPosition, setToolbarPosition] = useState(null);

  const width = canvasConfig?.width || 1080;
  const height = canvasConfig?.height || 1080;
  const backgroundColor = canvasConfig?.backgroundColor || '#FFF7ED';

  // Update Konva Transformer nodes when selection changes
  useEffect(() => {
    const stage = stageRef.current;
    const tr = transformerRef.current;
    if (!stage || !tr) return;

    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer().batchDraw();
      return;
    }

    const selectedNode = stage.findOne('#' + selectedId);
    const layerData = layers.find((l) => l.id === selectedId);

    // Attach transformer if the layer is editable and not locked
    if (selectedNode && layerData && layerData.editable !== false && !layerData.locked) {
      tr.nodes([selectedNode]);
    } else {
      tr.nodes([]);
    }
    tr.getLayer().batchDraw();
  }, [selectedId, layers]);

  // Konva caches text metrics on first paint, so when a web/custom font finishes
  // loading after the canvas has rendered we must force a redraw to pick it up.
  useEffect(() => {
    const stage = stageRef.current;
    if (stage) stage.draw();
  }, [fontTick]);

  // Update floating quick-action toolbar position in real-time
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !selectedId) {
      setToolbarPosition(null);
      return;
    }

    const selectedNode = stage.findOne('#' + selectedId);
    if (!selectedNode) {
      setToolbarPosition(null);
      return;
    }

    const updatePosition = () => {
      try {
        const clientRect = selectedNode.getClientRect();
        setToolbarPosition({
          x: clientRect.x,
          y: clientRect.y,
          width: clientRect.width,
          height: clientRect.height,
        });
      } catch (err) {
        const pos = selectedNode.getAbsolutePosition();
        setToolbarPosition({
          x: pos.x,
          y: pos.y,
          width: (selectedLayer?.width || 100) * scale,
          height: (selectedLayer?.height || 100) * scale,
        });
      }
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 50);

    selectedNode.on('dragmove', updatePosition);
    selectedNode.on('transform', updatePosition);

    return () => {
      clearTimeout(timer);
      selectedNode.off('dragmove', updatePosition);
      selectedNode.off('transform', updatePosition);
    };
  }, [selectedId, layers, scale]);

  // Handle stage deselect click-outside
  const handleStageMouseDown = (e) => {
    // clicked on stage background
    if (e.target === e.target.getStage()) {
      onSelect(null);
      setEditingId(null);
    }
  };

  // Trigger double-click inline text edit overlay
  const handleDoubleClick = (layerId) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.type !== 'text' || layer.editable === false || layer.locked) return;

    const stage = stageRef.current;
    const textNode = stage.findOne('#' + layerId);
    if (!textNode) return;

    const textPosition = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    setEditingId(layerId);
    setEditingText(layer.text);

    // Position text area exactly over the canvas text node
    setTextareaStyle({
      position: 'absolute',
      top: `${stageBox.top + window.scrollY + textPosition.y}px`,
      left: `${stageBox.left + window.scrollX + textPosition.x}px`,
      width: `${textNode.width() * scale}px`,
      height: `${textNode.height() * scale}px`,
      fontSize: `${(layer.fontSize || 24) * scale}px`,
      fontFamily: layer.fontFamily || 'Poppins',
      lineHeight: layer.lineHeight || 1.2,
      letterSpacing: `${(layer.letterSpacing || 0) * scale}px`,
      color: layer.fill || '#111827',
      textAlign: layer.align || 'center',
      border: '1px solid #6366F1',
      background: 'rgba(255, 255, 255, 0.95)',
      outline: 'none',
      resize: 'none',
      zIndex: 1000,
      padding: '4px',
      borderRadius: '4px',
      overflow: 'hidden',
    });
  };

  const handleTextareaBlur = () => {
    if (editingId) {
      const layer = layers.find((l) => l.id === editingId);
      if (layer) {
        let updated = { ...layer, text: editingText };
        // Keep the bounding box hugging the text unless the user locked the width.
        if (updated.autoFit !== false) {
          updated = { ...updated, ...measureText(updated) };
        }
        onChangeLayer(updated);
      }
    }
    setEditingId(null);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      {/* Target Canvas Container */}
      <div
        className="shadow-2xl border border-card-border/50 relative"
        style={{
          width: `${width * scale}px`,
          height: `${height * scale}px`,
          backgroundColor: backgroundColor,
        }}
      >
        <Stage
          ref={stageRef}
          width={width * scale}
          height={height * scale}
          scaleX={scale}
          scaleY={scale}
          onMouseDown={handleStageMouseDown}
          onTouchStart={handleStageMouseDown}
        >
          <Layer>
            {/* Map layers to Konva nodes. Each layer is a single draggable node
                that also owns its click + double-click handlers, so dragging
                works directly (no wrapper group intercepting the gesture). */}
            {layers.map((layer) => (
              <LayerRenderer
                key={layer.id}
                layer={layer}
                isSelected={layer.id === selectedId}
                onSelect={onSelect}
                onChange={onChangeLayer}
                onRequestEdit={() => handleDoubleClick(layer.id)}
              />
            ))}

            {/* Selection transformer box */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Prevent scaling node into negative width/height
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              keepRatio={false}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
            />
          </Layer>
        </Stage>

        {/* Selected Layer Toolbar overlay */}
        {selectedId && toolbarPosition && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(5, toolbarPosition.x + toolbarPosition.width / 2)}px`,
              top: `${Math.max(5, toolbarPosition.y - 45)}px`,
              transform: 'translateX(-50%)',
              zIndex: 50,
            }}
            className="flex items-center gap-1.5 p-1 bg-zinc-900/95 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-md transition-all animate-in zoom-in-95 duration-100"
          >
            {/* Duplicate button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedLayer && !selectedLayer.locked) {
                  onDuplicateLayer();
                }
              }}
              disabled={selectedLayer?.locked}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Lock/Unlock button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (selectedLayer) {
                  onChangeLayer({
                    ...selectedLayer,
                    locked: !selectedLayer.locked,
                  });
                }
              }}
              className={`p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-pointer flex items-center justify-center ${
                selectedLayer?.locked ? 'text-red-400 hover:text-red-300' : 'text-zinc-300 hover:text-white'
              }`}
              title={selectedLayer?.locked ? 'Unlock Layer' : 'Lock Layer'}
            >
              {selectedLayer?.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>

            {/* Separator line */}
            <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteLayer();
              }}
              className="p-1.5 hover:bg-red-500/20 rounded text-zinc-300 hover:text-red-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Floating textarea overlay for double-click edits */}
      {editingId && (
        <textarea
          style={textareaStyle}
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={handleTextareaBlur}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleTextareaBlur();
            }
          }}
        />
      )}
    </div>
  );
};
export default KonvaCanvas;
