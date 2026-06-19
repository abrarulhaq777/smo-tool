/**
 * Automatically enhances a simple poster design by injecting decorative elements,
 * shadows, gradient backgrounds, and badges if the design has fewer than 8 layers.
 */
export function enhancePosterDesign(design, businessType = 'Business') {
  if (!design || !design.layers) return design;

  // Clone to avoid side effects
  const enhanced = JSON.parse(JSON.stringify(design));
  
  const layerCount = enhanced.layers.length;
  if (layerCount >= 8) {
    return enhanced; // Design is already rich enough
  }

  console.log(`Auto-enhancing simple design for "${businessType}" (${layerCount} layers)`);

  const primaryColor = enhanced.theme?.primaryColor || '#EA580C';
  const secondaryColor = enhanced.theme?.secondaryColor || '#FDBA74';
  const accentColor = enhanced.theme?.accentColor || '#111827';

  // 1. Check if background is simple, upgrade to a gradient rect
  const bgIndex = enhanced.layers.findIndex(l => l.id.includes('bg') || l.type === 'rect' && l.x === 0 && l.y === 0);
  if (bgIndex !== -1) {
    const originalBg = enhanced.layers[bgIndex];
    if (originalBg.type === 'rect') {
      enhanced.layers[bgIndex] = {
        id: 'bg_gradient',
        type: 'gradient_rect',
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
        fill: [originalBg.fill || '#FFF7ED', secondaryColor || '#FED7AA'],
        gradientDirection: 'vertical',
        locked: true,
        editable: false,
        zIndex: 0
      };
    }
  } else {
    // Inject a default gradient background at start
    enhanced.layers.unshift({
      id: 'bg_gradient',
      type: 'gradient_rect',
      x: 0,
      y: 0,
      width: 1080,
      height: 1080,
      fill: ['#FFF7ED', '#FED7AA'],
      gradientDirection: 'vertical',
      locked: true,
      editable: false,
      zIndex: 0
    });
  }

  // 2. Inject decorative shapes (Circles / Blobs / Waves)
  const decorativeCircles = [
    {
      id: 'decor_circle_top_right',
      type: 'circle',
      x: 950,
      y: 100,
      width: 320,
      height: 320,
      fill: secondaryColor,
      opacity: 0.4,
      editable: true,
      locked: false,
      zIndex: 1
    },
    {
      id: 'decor_blob_bottom_left',
      type: 'blob',
      x: -100,
      y: 800,
      width: 380,
      height: 380,
      fill: primaryColor,
      opacity: 0.15,
      editable: true,
      locked: false,
      zIndex: 2
    }
  ];

  // Inject decorative shapes after the background layer
  enhanced.layers.splice(1, 0, ...decorativeCircles);

  // 3. Add shadow styling and rounded corners to images and frames
  enhanced.layers = enhanced.layers.map(layer => {
    // Enhance image placeholders
    if (layer.type === 'image_placeholder') {
      return {
        ...layer,
        cornerRadius: layer.cornerRadius || 24,
        stroke: layer.stroke || primaryColor,
        strokeWidth: layer.strokeWidth || 2,
        shadowColor: '#000000',
        shadowBlur: 20,
        shadowOpacity: 0.15,
        shadowOffsetY: 8,
        shadowOffsetX: 0
      };
    }
    
    // Enhance button shapes
    if (layer.type === 'button') {
      return {
        ...layer,
        cornerRadius: layer.cornerRadius || 40,
        shadowColor: '#000000',
        shadowBlur: 12,
        shadowOpacity: 0.2,
        shadowOffsetY: 6,
        shadowOffsetX: 0
      };
    }

    return layer;
  });

  // 4. Inject a badge overlay if not present
  const hasBadge = enhanced.layers.some(l => l.type === 'badge');
  if (!hasBadge) {
    const badgeLayer = {
      id: 'decor_badge_offer',
      type: 'badge',
      x: 760,
      y: 480,
      width: 220,
      height: 80,
      fill: '#DC2626', // Red offer fill
      text: 'BEST CHOICE',
      textColor: '#FFFFFF',
      fontSize: 28,
      fontFamily: enhanced.theme?.fontFamily || 'Poppins',
      fontStyle: 'bold',
      cornerRadius: 40,
      rotation: -8,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOpacity: 0.2,
      shadowOffsetY: 4,
      editable: true,
      locked: false,
      zIndex: 5
    };
    enhanced.layers.push(badgeLayer);
  }

  // 5. Update z-index indices so they represent a strict incremental stack
  enhanced.layers = enhanced.layers
    .map((l, index) => ({
      ...l,
      zIndex: index
    }))
    .sort((a, b) => a.zIndex - b.zIndex);

  return enhanced;
}
export default enhancePosterDesign;
