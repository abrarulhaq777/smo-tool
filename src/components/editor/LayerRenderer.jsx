import React from 'react';
import { Rect, Circle, Ellipse, Text, Group, Line, Arrow, Path, Star, RegularPolygon, TextPath, Shape } from 'react-konva';
import { ImagePlaceholder } from './ImagePlaceholder';
import { QrCode } from './QrCode';
import { IconLayer } from './IconLayer';

// Predefined vector path data for blobs and waves normalized to a 100x100 box
const BLOB_PATH = "M25,10 C40,5 75,10 85,25 C95,40 95,70 85,85 C75,100 35,100 20,85 C5,70 5,40 10,25 C15,10 10,15 25,10 Z";
const WAVE_PATH = "M0,50 Q25,25 50,50 T100,50 L100,100 L0,100 Z";
// New decorative shapes normalized to a 100x100 box
const HEART_PATH = "M50,88 C12,60 8,33 26,20 C38,11 50,20 50,30 C50,20 62,11 74,20 C92,33 88,60 50,88 Z";
const SHIELD_PATH = "M50,5 L92,20 V52 C92,74 74,90 50,97 C26,90 8,74 8,52 V20 Z";
const RIBBON_PATH = "M5,20 H95 V70 L80,58 L95,46 V70 H5 V46 L20,58 L5,70 Z";
const BUBBLE_PATH = "M10,8 H90 a8,8 0 0 1 8,8 V60 a8,8 0 0 1 -8,8 H40 L24,86 V68 H10 a8,8 0 0 1 -8,-8 V16 a8,8 0 0 1 8,-8 Z";

export const LayerRenderer = ({ layer, isSelected, onSelect, onChange }) => {
  // Draggable unless explicitly locked or explicitly marked non-editable.
  // (Previously `layer.editable && ...` made layers with an undefined `editable`
  // — e.g. template layers — silently non-draggable.)
  const isDraggable = layer.editable !== false && !layer.locked;

  // Nodes are rendered with a centered offset (see the cloneElement wrapper below)
  // so rotation pivots around the center. Convert the node's center position back
  // to the stored top-left by subtracting the offset.
  const handleDragEnd = (e) => {
    const node = e.target;
    onChange({
      ...layer,
      x: Math.round(node.x() - node.offsetX()),
      y: Math.round(node.y() - node.offsetY()),
    });
  };

  const handleTransformEnd = (e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scaling factor and apply to width/height to prevent scaling distortions
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(5, node.width() * scaleX);
    const newHeight = Math.max(5, node.height() * scaleY);

    const updated = {
      ...layer,
      // node.x()/y() is the centre (offset is centred); convert back to top-left.
      x: Math.round(node.x() - newWidth / 2),
      y: Math.round(node.y() - newHeight / 2),
      rotation: Math.round(node.rotation()),
      width: Math.round(newWidth),
      height: Math.round(newHeight),
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

  const rendered = (() => {
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
            filter={layer.filter}
            frame={layer.frame}
            frameSkew={layer.frameSkew}
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
      const numPoints = layer.numPoints || 5;
      const ratio = layer.innerRadiusRatio || 0.4;
      // Points on an ellipse so the star stretches to fill the box (free resize).
      const pts = [];
      for (let i = 0; i < numPoints * 2; i++) {
        const r = i % 2 === 0 ? 1 : ratio;
        const a = (i / (numPoints * 2)) * Math.PI * 2 - Math.PI / 2;
        pts.push(w / 2 + (w / 2) * r * Math.cos(a), h / 2 + (h / 2) * r * Math.sin(a));
      }
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line points={pts} closed fill={layer.fill || '#EAB308'} stroke={layer.stroke} strokeWidth={layer.strokeWidth} />
        </Group>
      );
    }

    case 'polygon': {
      const w = layer.width || 100;
      const h = layer.height || 100;
      const sides = Math.max(3, layer.sides || 3);
      // Points on an ellipse so the polygon stretches to fill the box (free resize).
      const pts = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        pts.push(w / 2 + (w / 2) * Math.cos(a), h / 2 + (h / 2) * Math.sin(a));
      }
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line points={pts} closed fill={layer.fill || '#3B82F6'} stroke={layer.stroke} strokeWidth={layer.strokeWidth} />
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
      const count = Math.max(1, layer.count || 2); // number of wave humps
      const seg = w / count;
      let d = `M 0 ${h / 2}`;
      for (let i = 0; i < count; i++) {
        const sx = i * seg;
        d += ` Q ${sx + seg * 0.25} 0 ${sx + seg * 0.5} ${h / 2} Q ${sx + seg * 0.75} ${h} ${sx + seg} ${h / 2}`;
      }
      d += ` L ${w} ${h} L 0 ${h} Z`;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Path
            data={layer.pathData || d}
            fill={layer.fill || '#60A5FA'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
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

    case 'triangle': {
      const w = layer.width || 120;
      const h = layer.height || 120;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line
            points={[w / 2, 0, w, h, 0, h]}
            closed
            fill={layer.fill || '#3B82F6'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            cornerRadius={layer.cornerRadius || 0}
          />
        </Group>
      );
    }

    case 'hexagon': {
      const w = layer.width || 120;
      const h = layer.height || 120;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(w / 2 + (w / 2) * Math.cos(a), h / 2 + (h / 2) * Math.sin(a));
      }
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line points={pts} closed fill={layer.fill || '#8B5CF6'} stroke={layer.stroke} strokeWidth={layer.strokeWidth} />
        </Group>
      );
    }

    case 'heart':
    case 'shield': {
      const w = layer.width || 120;
      const h = layer.height || 120;
      const data = layer.type === 'heart' ? HEART_PATH : SHIELD_PATH;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Path
            data={data}
            fill={layer.fill || (layer.type === 'heart' ? '#EF4444' : '#0EA5E9')}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            scaleX={w / 100}
            scaleY={h / 100}
          />
        </Group>
      );
    }

    case 'ribbon': {
      const w = layer.width || 300;
      const h = layer.height || 90;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Path
            data={RIBBON_PATH}
            fill={layer.fill || '#DC2626'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            scaleX={w / 100}
            scaleY={h / 100}
          />
          <Text
            x={w * 0.2}
            y={h / 2 - (layer.fontSize || 26) / 1.7}
            width={w * 0.6}
            text={layer.text || 'OFFER'}
            fill={layer.textColor || '#FFFFFF'}
            fontSize={layer.fontSize || 26}
            fontFamily={layer.fontFamily || 'Poppins'}
            fontStyle={layer.fontStyle || 'bold'}
            align="center"
          />
        </Group>
      );
    }

    case 'speech_bubble': {
      const w = layer.width || 280;
      const h = layer.height || 180;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Path
            data={BUBBLE_PATH}
            fill={layer.fill || '#1E293B'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
            scaleX={w / 100}
            scaleY={h / 100}
          />
          <Text
            x={w * 0.1}
            y={h * 0.12}
            width={w * 0.8}
            height={h * 0.6}
            text={layer.text || 'Hello!'}
            fill={layer.textColor || '#FFFFFF'}
            fontSize={layer.fontSize || 26}
            fontFamily={layer.fontFamily || 'Poppins'}
            fontStyle={layer.fontStyle || 'bold'}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }

    case 'divider': {
      const w = layer.width || 300;
      const h = layer.height || 24;
      const color = layer.stroke || layer.fill || '#94A3B8';
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line points={[0, h / 2, w / 2 - 14, h / 2]} stroke={color} strokeWidth={layer.strokeWidth || 3} />
          <Line points={[w / 2 + 14, h / 2, w, h / 2]} stroke={color} strokeWidth={layer.strokeWidth || 3} />
          <Circle x={w / 2} y={h / 2} radius={6} fill={color} />
        </Group>
      );
    }

    case 'progress_bar': {
      const w = layer.width || 360;
      const h = layer.height || 28;
      const pct = Math.max(0, Math.min(1, (layer.value !== undefined ? layer.value : 70) / 100));
      const radius = layer.cornerRadius !== undefined ? layer.cornerRadius : h / 2;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Rect x={0} y={0} width={w} height={h} fill={layer.trackColor || '#E2E8F0'} cornerRadius={radius} />
          <Rect x={0} y={0} width={Math.max(h, w * pct)} height={h} fill={layer.fill || '#22C55E'} cornerRadius={radius} />
        </Group>
      );
    }

    case 'rating': {
      const max = layer.max || 5;
      const value = layer.value !== undefined ? layer.value : 5;
      const w = layer.width || max * 56;
      const h = layer.height || 56;
      const gap = w / max;
      const r = Math.min(gap, h) / 2.4;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          {Array.from({ length: max }).map((_, i) => (
            <Star
              key={i}
              x={gap * i + gap / 2}
              y={h / 2}
              numPoints={5}
              innerRadius={r * 0.45}
              outerRadius={r}
              fill={i < value ? (layer.fill || '#FACC15') : (layer.emptyColor || '#E2E8F0')}
            />
          ))}
        </Group>
      );
    }

    case 'chakra': {
      const w = layer.width || 160;
      const h = layer.height || 160;
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) / 2;
      const spokes = layer.spokes || 24;
      const color = layer.fill || '#000080';
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Circle x={cx} y={cy} radius={R} stroke={color} strokeWidth={layer.strokeWidth || Math.max(3, R * 0.08)} />
          {Array.from({ length: spokes }).map((_, i) => {
            const a = (i / spokes) * Math.PI * 2;
            return (
              <Line
                key={i}
                points={[cx, cy, cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92]}
                stroke={color}
                strokeWidth={Math.max(1, R * 0.025)}
              />
            );
          })}
          <Circle x={cx} y={cy} radius={Math.max(4, R * 0.12)} fill={color} />
        </Group>
      );
    }

    case 'pattern': {
      const w = layer.width || 400;
      const h = layer.height || 400;
      const variant = layer.variant || 'dots';
      const color = layer.fill || '#CBD5E1';
      const gap = layer.gap || 32;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Shape
            width={w}
            height={h}
            sceneFunc={(ctx, shape) => {
              ctx.save();
              ctx.beginPath();
              ctx.rect(0, 0, w, h);
              ctx.clip();
              ctx.strokeStyle = color;
              ctx.fillStyle = color;
              ctx.lineWidth = layer.strokeWidth || 2;
              if (variant === 'grid') {
                for (let gx = 0; gx <= w; gx += gap) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
                for (let gy = 0; gy <= h; gy += gap) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
              } else if (variant === 'stripes') {
                for (let s = -h; s <= w; s += gap) { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s + h, h); ctx.stroke(); }
              } else {
                for (let dy = gap / 2; dy < h; dy += gap) {
                  for (let dx = gap / 2; dx < w; dx += gap) {
                    ctx.beginPath(); ctx.arc(dx, dy, (layer.dotRadius || 3), 0, Math.PI * 2); ctx.fill();
                  }
                }
              }
              ctx.restore();
              ctx.fillStrokeShape(shape);
            }}
          />
        </Group>
      );
    }

    case 'curved_text': {
      const w = layer.width || 300;
      const h = layer.height || 300;
      const r = Math.min(w, h) / 2;
      // Upper semicircle arc path centred in the box
      const arc = `M ${w / 2 - r},${h / 2} a ${r},${r} 0 1,1 ${r * 2},0`;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <TextPath
            data={arc}
            text={layer.text || 'CURVED TEXT'}
            fill={layer.fill || '#111827'}
            fontSize={layer.fontSize || 28}
            fontFamily={layer.fontFamily || 'Poppins'}
            fontStyle={layer.fontStyle || 'bold'}
            align="center"
          />
        </Group>
      );
    }

    case 'qr_code': {
      const w = layer.width || 200;
      const h = layer.height || 200;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <QrCode
            x={0}
            y={0}
            width={w}
            height={h}
            value={layer.value || layer.qrValue || 'https://example.com'}
            fgColor={layer.fill || '#000000'}
            bgColor={layer.bgColor || '#FFFFFF'}
          />
        </Group>
      );
    }

    case 'icon': {
      const w = layer.width || 64;
      const h = layer.height || 64;
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <IconLayer
            x={0}
            y={0}
            width={w}
            height={h}
            icon={layer.icon || 'star'}
            color={layer.fill || layer.stroke || '#111827'}
            fill={layer.iconFill || 'none'}
          />
        </Group>
      );
    }

    case 'angled_block': {
      const w = layer.width || 400;
      const h = layer.height || 300;
      const s = w * (layer.skew !== undefined ? layer.skew : 0.18);
      const dir = layer.direction || 'right';
      let points;
      if (dir === 'left') points = [0, 0, w - s, 0, w, h, s, h];
      else if (dir === 'top') points = [0, s, w, 0, w, h, 0, h];
      else if (dir === 'bottom') points = [0, 0, w, 0, w, h - s, 0, h];
      else points = [s, 0, w, 0, w - s, h, 0, h]; // 'right' (default)
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          <Line
            points={points}
            closed
            fill={layer.fill || '#1E293B'}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth}
          />
        </Group>
      );
    }

    case 'checklist': {
      const items = Array.isArray(layer.items) && layer.items.length
        ? layer.items
        : ['First item', 'Second item', 'Third item'];
      const w = layer.width || 420;
      const rowH = layer.rowHeight || 58;
      const h = layer.height || items.length * rowH;
      const fontSize = layer.fontSize || 26;
      const checkColor = layer.checkColor || layer.fill || '#F59E0B';
      const textColor = layer.textColor || '#1E293B';
      const cs = Math.min(rowH * 0.5, 28); // check mark size
      return (
        <Group {...commonProps} x={layer.x} y={layer.y} width={w} height={h}>
          {items.map((it, i) => {
            const cy = i * rowH + rowH / 2;
            return (
              <Group key={i}>
                <Line
                  points={[0, cs * 0.55, cs * 0.38, cs * 0.9, cs, 0]}
                  x={0}
                  y={cy - cs / 2}
                  stroke={checkColor}
                  strokeWidth={Math.max(3, cs * 0.16)}
                  lineCap="round"
                  lineJoin="round"
                />
                <Text
                  x={cs + 18}
                  y={cy - fontSize / 1.7}
                  width={w - cs - 18}
                  text={String(it)}
                  fontSize={fontSize}
                  fill={textColor}
                  fontFamily={layer.fontFamily || 'Poppins'}
                  fontStyle={layer.fontStyle || 'normal'}
                  verticalAlign="middle"
                />
              </Group>
            );
          })}
        </Group>
      );
    }

    default:
      return null;
  }
  })();

  if (!rendered) return null;

  // Render every layer with a centered offset so rotation pivots around its centre
  // (and the Transformer rotates around the middle), without touching each case.
  const W = Number(rendered.props.width) || Number(layer.width) || 100;
  const H = Number(rendered.props.height) || Number(layer.height) || 100;
  return React.cloneElement(rendered, {
    x: (Number(layer.x) || 0) + W / 2,
    y: (Number(layer.y) || 0) + H / 2,
    offsetX: W / 2,
    offsetY: H / 2,
  });
};
