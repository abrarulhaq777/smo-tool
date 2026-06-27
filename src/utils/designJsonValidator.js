/**
 * Validates and cleans up the poster design JSON structure returned from AI.
 * If critical parts are missing, it returns null or standard fallback fields.
 */
export function validateDesignJson(designJson) {
  if (!designJson || typeof designJson !== 'object') {
    return null;
  }

  const cleaned = {
    canvas: {
      width: 1080,
      height: 1080,
      backgroundColor: '#FFF7ED',
      ...designJson.canvas
    },
    theme: {
      primaryColor: '#EA580C',
      secondaryColor: '#FDBA74',
      accentColor: '#111827',
      fontFamily: 'Poppins',
      ...designJson.theme
    },
    layers: []
  };

  if (!Array.isArray(designJson.layers)) {
    return null;
  }

  // Map and sanitize layers
  cleaned.layers = designJson.layers
    .map((layer, index) => {
      if (!layer || typeof layer !== 'object' || !layer.type) {
        return null;
      }

      const id = layer.id || `${layer.type}_${Date.now()}_${index}`;

      // Standard base layer properties. Spread the original layer first so that
      // component-specific props (items, skew, direction, variant, spokes, value,
      // frame, checkColor, …) are preserved; then normalize the core fields.
      const baseLayer = {
        ...layer,
        id,
        type: layer.type,
        x: Number(layer.x) || 0,
        y: Number(layer.y) || 0,
        width: Number(layer.width) || 200,
        height: Number(layer.height) || 200,
        opacity: layer.opacity !== undefined ? Number(layer.opacity) : 1,
        fill: layer.fill || '#EA580C',
        locked: Boolean(layer.locked),
        editable: layer.editable !== undefined ? Boolean(layer.editable) : true
      };

      // Type specific checks
      if (layer.type === 'text') {
        return {
          ...baseLayer,
          text: String(layer.text || 'Text Layer'),
          fontSize: Number(layer.fontSize) || 32,
          fontFamily: layer.fontFamily || cleaned.theme.fontFamily || 'Poppins',
          fontStyle: layer.fontStyle || 'normal',
          align: layer.align || 'center'
        };
      }

      if (layer.type === 'image_placeholder' || layer.type === 'image') {
        return {
          ...baseLayer,
          cornerRadius: Number(layer.cornerRadius) || 0,
          placeholderText: String(layer.placeholderText || 'Upload Image'),
          imageUrl: layer.imageUrl || null,
          stroke: layer.stroke || 'transparent',
          strokeWidth: Number(layer.strokeWidth) || 0,
          fit: layer.fit || 'cover'
        };
      }

      if (layer.type === 'button') {
        return {
          ...baseLayer,
          cornerRadius: Number(layer.cornerRadius) || 0,
          text: String(layer.text || 'Button'),
          textColor: layer.textColor || '#FFFFFF',
          fontSize: Number(layer.fontSize) || 24,
          fontFamily: layer.fontFamily || cleaned.theme.fontFamily || 'Poppins',
          fontStyle: layer.fontStyle || 'bold'
        };
      }

      if (layer.type === 'rect') {
        return {
          ...baseLayer,
          cornerRadius: Number(layer.cornerRadius) || 0
        };
      }

      if (layer.type === 'circle') {
        return {
          ...baseLayer,
          radius: Number(layer.radius) || Number(layer.width) / 2 || 100
        };
      }

      // Default rect for unknown shapes
      return baseLayer;
    })
    .filter(Boolean);

  // Must have at least one layer to render
  if (cleaned.layers.length === 0) {
    return null;
  }

  return cleaned;
}
