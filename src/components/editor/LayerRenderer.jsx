import React from 'react';
import { Rect, Circle, Ellipse, Text, Group, Line, Arrow, Path, Star, RegularPolygon } from 'react-konva';
import { ImagePlaceholder } from './ImagePlaceholder';

// Predefined vector path data for blobs and waves normalized to a 100x100 box
const BLOB_PATH = "M25,10 C40,5 75,10 85,25 C95,40 95,70 85,85 C75,100 35,100 20,85 C5,70 5,40 10,25 C15,10 10,15 25,10 Z";
const WAVE_PATH = "M0,50 Q25,25 50,50 T100,50 L100,100 L0,100 Z";

export const LayerRenderer = ({ layer, isSelected, onSelect, onChange }) => {
  const isDraggable = layer.editable && !layer.locked;

  const handleDragEnd = (e) => {
    onChange({
      ...layer,
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y()),
    });
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling factor and apply to width/height to prevent scaling distortions
    node.scaleX(1);
    node.scaleY(1);

    const updated = {
      ...layer,
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      rotation: Math.round(node.rotation()),
      width: Math.round(Math.max(5, node.width() * scaleX)),
      height: Math.round(Math.max(5, node.height() * scaleY)),
    };

    if (layer.type === 'circle') {
      updated.radius = Math.round(Math.min(updated.width, updated.height) / 2);
    } else if (layer.type === 'text') {
      const avgScale = (scaleX + scaleY) / 2;
      // Proportional resize scales the font size, non-proportional wraps
      if (Math.abs(scaleX - scaleY) < 0.1 && Math.abs(avgScale - 1) > 0.01) {
        updated.fontSize = Math.round((layer.fontSize || 24) * avgScale);
      }
    }

    onChange(updated);
  };

  const commonProps = {
    id: layer.id,
    name: 'selectable-layer',
    draggable: isDraggable,
    opacity: layer.opacity !== undefined ? layer.opacity : 1,
    rotation: layer.rotation || 0,
    shadowColor: layer.shadowColor || null,
    shadowBlur: layer.shadowBlur !== undefined ? layer.shadowBlur : 0,
    shadowOpacity: layer.shadowOpacity !== undefined ? layer.shadowOpacity : 0,
    shadowOffsetX: layer.shadowOffsetX !== undefined ? layer.shadowOffsetX : 0,
    shadowOffsetY: layer.shadowOffsetY !== undefined ? layer.shadowOffsetY : 0,
    onClick: (e) => {
      e.cancelBubble = true; // Prevent stage deselect trigger
      onSelect(layer.id);
    },
    onTouchStart: (e) => {
      e.cancelBubble = true;
      onSelect(layer.id);
    },
    onDragEnd: handleDragEnd,
    onTransformEnd: handleTransformEnd,
  };

  switch (layer.type) {
    case 'rect':
      return (
        <Rect
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={layer.width || 100}
          height={layer.height || 100}
          fill={layer.fill || '#EA580C'}
          cornerRadius={layer.cornerRadius || 0}
          stroke={layer.stroke}
          strokeWidth={layer.strokeWidth}
        />
      );

    case 'gradient_rect': {
      const w = layer.width || 200;
      const h = layer.height || 200;
      const startPoint = { x: 0, y: 0 };
      let endPoint = { x: 0, y: h }; // default: vertical

      if (layer.gradientDirection === 'horizontal') {
        endPoint = { x: w, y: 0 };
      } else if (layer.gradientDirection === 'diagonal') {
        endPoint = { x: w, y: h };
      }

      let stops = [0, '#EA580C', 1, '#FDBA74'];
      if (Array.isArray(layer.fill)) {
        if (typeof layer.fill[0] === 'number') {
          stops = layer.fill;
        } else {
          stops = [0, layer.fill[0], 1, layer.fill[1] || layer.fill[0]];
        }
      } else if (typeof layer.fill === 'string') {
        stops = [0, layer.fill, 1, layer.fill];
      }

      return (
        <Rect
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
          fillLinearGradientStartPoint={startPoint}
          fillLinearGradientEndPoint={endPoint}
          fillLinearGradientColorStops={stops}
          cornerRadius={layer.cornerRadius || 0}
          stroke={layer.stroke}
          strokeWidth={layer.strokeWidth}
        />
      );
    }

    case 'circle': {
      const w = layer.width || (layer.radius ? layer.radius * 2 : 100);
      const h = layer.height || (layer.radius ? layer.radius * 2 : 100);
      const r = Math.min(w, h) / 2;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Circle
            x={w / 2}
            y={h / 2}
            radius={r}
            fill={layer.fill || '#EA580C'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
        </Group>
      );
    }

    case 'ellipse': {
      const w = layer.width || 100;
      const h = layer.height || 60;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Ellipse
            x={w / 2}
            y={h / 2}
            radiusX={w / 2}
            radiusY={h / 2}
            fill={layer.fill || '#EA580C'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
        </Group>
      );
    }

    case 'text':
      return (
        <Text
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={layer.width || 200}
          height={layer.height || 50}
          text={layer.text || ''}
          fontSize={layer.fontSize || 24}
          fontFamily={layer.fontFamily || 'Poppins'}
          fontStyle={layer.fontStyle || 'normal'}
          fill={layer.fill || '#111827'}
          align={layer.align || 'left'}
          verticalAlign="middle"
        />
      );

    case 'image_placeholder':
    case 'image':
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={layer.width || 200}
          height={layer.height || 200}
        >
          <ImagePlaceholder
            x={0}
            y={0}
            width={layer.width || 200}
            height={layer.height || 200}
            cornerRadius={layer.cornerRadius}
            fill={layer.fill}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            placeholderText={layer.placeholderText}
            imageUrl={layer.imageUrl}
            fit={layer.fit}
          />
        </Group>
      );

    case 'button': {
      const w = layer.width || 300;
      const h = layer.height || 70;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={layer.fill || '#EA580C'}
            cornerRadius={layer.cornerRadius !== undefined ? layer.cornerRadius : h / 2}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
          <Text
            x={10}
            y={h / 2 - (layer.fontSize || 24) / 1.7}
            width={w - 20}
            text={layer.text || 'Button'}
            fill={layer.textColor || '#FFFFFF'}
            fontSize={layer.fontSize || 24}
            fontFamily={layer.fontFamily || 'Poppins'}
            fontStyle={layer.fontStyle || 'bold'}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }

    case 'badge': {
      const w = layer.width || 200;
      const h = layer.height || 60;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill={layer.fill || '#DC2626'}
            cornerRadius={layer.cornerRadius !== undefined ? layer.cornerRadius : h / 2}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
          <Text
            x={10}
            y={h / 2 - (layer.fontSize || 20) / 1.7}
            width={w - 20}
            text={layer.text || 'BADGE'}
            fill={layer.textColor || '#FFFFFF'}
            fontSize={layer.fontSize || 20}
            fontFamily={layer.fontFamily || 'Poppins'}
            fontStyle={layer.fontStyle || 'bold'}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }

    case 'line': {
      const w = layer.width || 200;
      const h = layer.height || 10;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Line
            points={[0, h / 2, w, h / 2]}
            stroke={layer.stroke || layer.fill || '#1E293B'}
            strokeWidth={layer.strokeWidth || 4}
            dash={layer.dash}
          />
        </Group>
      );
    }

    case 'arrow': {
      const w = layer.width || 150;
      const h = layer.height || 50;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Arrow
            points={[0, h / 2, w, h / 2]}
            pointerLength={layer.pointerLength || 15}
            pointerWidth={layer.pointerWidth || 15}
            fill={layer.fill || '#EA580C'}
            stroke={layer.stroke || layer.fill || '#EA580C'}
            strokeWidth={layer.strokeWidth || 4}
          />
        </Group>
      );
    }

    case 'star': {
      const w = layer.width || 100;
      const h = layer.height || 100;
      const outerRadius = Math.min(w, h) / 2;
      const innerRadius = outerRadius * (layer.innerRadiusRatio || 0.4);
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Star
            x={w / 2}
            y={h / 2}
            numPoints={layer.numPoints || 5}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill={layer.fill || '#EAB308'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
        </Group>
      );
    }

    case 'polygon': {
      const w = layer.width || 100;
      const h = layer.height || 100;
      const radius = Math.min(w, h) / 2;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <RegularPolygon
            x={w / 2}
            y={h / 2}
            sides={layer.sides || 3}
            radius={radius}
            fill={layer.fill || '#3B82F6'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
        </Group>
      );
    }

    case 'blob': {
      const w = layer.width || 200;
      const h = layer.height || 200;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Path
            data={layer.pathData || BLOB_PATH}
            fill={layer.fill || '#F87171'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            scaleX={w / 100}
            scaleY={h / 100}
          />
        </Group>
      );
    }

    case 'wave': {
      const w = layer.width || 400;
      const h = layer.height || 150;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Path
            data={layer.pathData || WAVE_PATH}
            fill={layer.fill || '#60A5FA'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            scaleX={w / 100}
            scaleY={h / 100}
          />
        </Group>
      );
    }

    case 'icon_placeholder': {
      const w = layer.width || 60;
      const h = layer.height || 60;
      const r = Math.min(w, h) / 2;
      return (
        <Group
          {...commonProps}
          x={layer.x}
          y={layer.y}
          width={w}
          height={h}
        >
          <Circle
            x={w / 2}
            y={h / 2}
            radius={r}
            fill={layer.fill || '#E2E8F0'}
            stroke={layer.stroke || '#94A3B8'}
            strokeWidth={layer.strokeWidth || 2}
          />
          <Text
            x={0}
            y={h / 2 - (layer.fontSize || 20) / 1.7}
            width={w}
            text={layer.icon || '★'}
            fill={layer.textColor || '#64748B'}
            fontSize={layer.fontSize || 20}
            align="center"
          />
        </Group>
      );
    }

    default:
      return null;
  }
};
