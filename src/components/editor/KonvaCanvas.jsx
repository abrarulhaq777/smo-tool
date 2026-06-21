import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Group } from 'react-konva';
import { LayerRenderer } from './LayerRenderer';

export const KonvaCanvas = ({
  layers,
  selectedId,
  onSelect,
  onChangeLayer,
  scale = 1,
  canvasConfig,
  stageRef: externalStageRef
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
        onChangeLayer({
          ...layer,
          text: editingText,
        });
      }
    }
    setEditingId(null);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full select-none">
      {/* Target Canvas Container */}
      <div 
        className="shadow-2xl border border-card-border/50"
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
            {/* Map layers to Konva nodes */}
            {layers.map((layer) => (
              <Group 
                key={layer.id}
                onDblClick={() => handleDoubleClick(layer.id)}
                onDblTap={() => handleDoubleClick(layer.id)}
              >
                <LayerRenderer
                  layer={layer}
                  isSelected={layer.id === selectedId}
                  onSelect={onSelect}
                  onChange={onChangeLayer}
                />
              </Group>
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
