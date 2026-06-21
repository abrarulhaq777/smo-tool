import React, { useEffect, useState } from 'react';
import { Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';
import QRCode from 'qrcode';

// Renders an editable QR code. The QR is generated to a PNG data URL from
// `value` and drawn as an image, so it exports cleanly with the rest of the canvas.
export const QrCode = ({ x = 0, y = 0, width = 200, height = 200, value = 'https://example.com', fgColor = '#000000', bgColor = '#FFFFFF' }) => {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value || ' ', {
      margin: 1,
      width: 512,
      color: { dark: fgColor || '#000000', light: bgColor || '#FFFFFF' },
    })
      .then((url) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setDataUrl(null); });
    return () => { active = false; };
  }, [value, fgColor, bgColor]);

  const [image] = useImage(dataUrl || '', 'anonymous');
  const size = Math.min(width, height);

  if (!image) {
    return <Rect x={x} y={y} width={size} height={size} fill={bgColor} stroke="#CBD5E1" strokeWidth={1} />;
  }
  return <KonvaImage image={image} x={x} y={y} width={size} height={size} />;
};
