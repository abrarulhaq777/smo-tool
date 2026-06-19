import React from 'react';
import { Group, Rect, Image, Text } from 'react-konva';
import useImage from 'use-image';

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
}) => {
  const [image, status] = useImage(imageUrl);

  const hasImage = imageUrl && status === 'loaded' && image;

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

  // Clip group function for cornerRadius rounding support
  const clipFunc = (ctx) => {
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, cornerRadius);
    ctx.closePath();
  };

  return (
    <Group x={x} y={y} clipFunc={clipFunc}>
      {/* Draw the image cropped to fit canvas shape */}
      <Image
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
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
