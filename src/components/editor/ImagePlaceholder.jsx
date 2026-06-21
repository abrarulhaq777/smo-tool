import React, { useRef, useEffect } from 'react';
import { Group, Rect, Image, Text } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';

// Supported image filters → Konva filter functions.
const FILTERS = {
  grayscale: [Konva.Filters.Grayscale],
  sepia: [Konva.Filters.Sepia],
  blur: [Konva.Filters.Blur],
  brighten: [Konva.Filters.Brighten],
  contrast: [Konva.Filters.Contrast],
  invert: [Konva.Filters.Invert],
};

export const ImagePlaceholder = ({
  x,
  y,
  width,
  height,
  cornerRadius = 0,
  fill = '#E2E8F0',
  stroke = '#94A3B8',
  strokeWidth = 0,
  placeholderText = 'Upload Image',
  imageUrl = null,
  fit = 'cover',
  filter = null,
  frame = 'rounded',
  frameSkew = 0.18,
}) => {
  // Request with crossOrigin 'anonymous' so external URLs don't taint the canvas
  // (a tainted canvas breaks stage.toDataURL() — i.e. Export PNG and AI preview).
  const [image, status] = useImage(imageUrl, 'anonymous');
  const imageRef = useRef(null);

  const hasImage = imageUrl && status === 'loaded' && image;

  // Apply/refresh Konva filters (requires caching the node first).
  useEffect(() => {
    const node = imageRef.current;
    if (!node || !hasImage) return;
    const fns = filter && FILTERS[filter];
    if (fns) {
      node.cache();
      node.filters(fns);
    } else {
      node.filters([]);
      node.clearCache();
    }
    node.getLayer()?.batchDraw();
  }, [hasImage, image, filter, width, height]);

  if (!hasImage) {
    // Render placeholder with dashed borders and helper text
    return (
      <Group x={x} y={y}>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke || '#94A3B8'}
          strokeWidth={2}
          dash={[8, 8]}
          cornerRadius={cornerRadius}
        />
        <Text
          x={20}
          y={height / 2 - 12}
          width={width - 40}
          text={placeholderText}
          fontSize={Math.max(14, Math.floor(width / 25))}
          fontFamily="Poppins"
          fill="#475569"
          align="center"
          fontStyle="bold"
        />
      </Group>
    );
  }

  // Calculate crop coordinates to simulate object-fit: cover or contain
  const imageRatio = image.width / image.height;
  const containerRatio = width / height;

  let cropWidth = image.width;
  let cropHeight = image.height;
  let cropX = 0;
  let cropY = 0;

  if (fit === 'cover') {
    if (imageRatio > containerRatio) {
      cropWidth = image.height * containerRatio;
      cropX = (image.width - cropWidth) / 2;
    } else {
      cropHeight = image.width / containerRatio;
      cropY = (image.height - cropHeight) / 2;
    }
  } else {
    // contain fit
    if (imageRatio > containerRatio) {
      cropHeight = image.width / containerRatio;
      cropY = (image.height - cropHeight) / 2;
    } else {
      cropWidth = image.height * containerRatio;
      cropX = (image.width - cropWidth) / 2;
    }
  }

  // Clip group function — masks the image to the chosen frame shape.
  const clipFunc = (ctx) => {
    const w = width;
    const h = height;
    ctx.beginPath();
    switch (frame) {
      case 'circle':
        ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case 'arch': {
        // Straight sides, semicircular top, flat bottom (sample-2 style).
        const r = Math.min(w / 2, h);
        ctx.moveTo(0, h);
        ctx.lineTo(0, r);
        ctx.arc(w / 2, r, w / 2, Math.PI, 0);
        ctx.lineTo(w, h);
        ctx.closePath();
        break;
      }
      case 'diagonal': {
        // Leaning parallelogram (sample-3 style).
        const s = w * (frameSkew || 0.18);
        ctx.moveTo(s, 0);
        ctx.lineTo(w, 0);
        ctx.lineTo(w - s, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        break;
      }
      case 'hexagon': {
        const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          const px = cx + rx * Math.cos(a);
          const py = cy + ry * Math.sin(a);
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      }
      default: // 'rounded'
        ctx.roundRect(0, 0, w, h, cornerRadius);
    }
    ctx.closePath();
  };

  return (
    <Group x={x} y={y} clipFunc={clipFunc}>
      {/* Draw the image cropped to fit canvas shape */}
      <Image
        ref={imageRef}
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        blurRadius={filter === 'blur' ? (10) : 0}
        brightness={filter === 'brighten' ? 0.2 : 0}
        contrast={filter === 'contrast' ? 30 : 0}
        crop={{
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight,
        }}
      />
      {strokeWidth > 0 && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          stroke={stroke}
          strokeWidth={strokeWidth * 2} // Double width due to clipping path cutting outline in half
          cornerRadius={cornerRadius}
        />
      )}
    </Group>
  );
};
