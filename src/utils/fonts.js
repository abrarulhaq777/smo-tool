import Konva from 'konva';

/**
 * Font registry + helpers for the poster editor.
 *
 * - GOOGLE_FONTS are loaded on demand by injecting <link> tags (chunked to keep
 *   the request URLs short enough for the Google Fonts API).
 * - Custom fonts are registered at runtime with the FontFace API and persisted
 *   as data URLs in localStorage so they survive reloads.
 * - measureText() reports the natural pixel size of a text layer so the editor
 *   can shrink the bounding box to hug the text.
 */

export const GOOGLE_FONTS = [
  'Poppins', 'Montserrat', 'Inter', 'Outfit', 'Roboto', 'Open Sans',
  'Lato', 'Nunito', 'Raleway', 'Work Sans', 'DM Sans', 'Rubik',
  'Quicksand', 'Josefin Sans', 'Archivo', 'Kanit', 'Cairo', 'Fredoka',
  'Comfortaa', 'Oswald', 'Bebas Neue', 'Anton', 'Teko', 'Righteous',
  'Playfair Display', 'Merriweather', 'Lora', 'Bree Serif', 'Abril Fatface',
  'Lobster', 'Pacifico', 'Dancing Script', 'Caveat', 'Satisfy',
  'Permanent Marker', 'Sacramento',
];

const WEIGHTS = '400;500;600;700;800';
const CHUNK = 10; // families per <link> to keep the URL length reasonable
const CUSTOM_KEY = 'tb_custom_fonts';

/** Inject (or refresh) the <link> tags that pull in the curated Google Fonts. */
export function loadGoogleFonts(families = GOOGLE_FONTS) {
  if (typeof document === 'undefined') return;
  for (let i = 0; i < families.length; i += CHUNK) {
    const batch = families.slice(i, i + CHUNK);
    const id = `tb-google-fonts-${i / CHUNK}`;
    if (document.getElementById(id)) continue;
    const fam = batch
      .map((f) => `family=${f.trim().replace(/\s+/g, '+')}:wght@${WEIGHTS}`)
      .join('&');
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
    document.head.appendChild(link);
  }
}

/** Read the persisted custom fonts ({ name, dataUrl }[]). */
export function getStoredCustomFonts() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Register one font with the browser so Canvas/Konva can render it. */
export async function registerCustomFont(name, dataUrl) {
  if (typeof window === 'undefined' || !window.FontFace) return name;
  const face = new FontFace(name, `url(${dataUrl})`);
  await face.load();
  document.fonts.add(face);
  return name;
}

/** Register every persisted custom font; resolves with their names. */
export async function loadStoredCustomFonts() {
  const fonts = getStoredCustomFonts();
  await Promise.all(
    fonts.map((f) => registerCustomFont(f.name, f.dataUrl).catch(() => {}))
  );
  return fonts.map((f) => f.name);
}

/** Persist a custom font (replacing any existing one with the same name). */
export function saveCustomFont(name, dataUrl) {
  try {
    const fonts = getStoredCustomFonts().filter((f) => f.name !== name);
    fonts.push({ name, dataUrl });
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(fonts));
  } catch {
    /* localStorage quota exceeded — the font still works for this session */
  }
}

/** Turn an uploaded font file into a usable family name + register it. */
export async function addCustomFontFromFile(file) {
  const name = file.name.replace(/\.(ttf|otf|woff2?|TTF|OTF|WOFF2?)$/, '').trim()
    || `Custom ${Date.now()}`;
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  await registerCustomFont(name, dataUrl);
  saveCustomFont(name, dataUrl);
  return name;
}

/**
 * Natural size of a text layer with no width constraint, so the editor can fit
 * the bounding box to the text. Returns rounded { width, height }.
 */
export function measureText(layer) {
  const node = new Konva.Text({
    text: layer.text || '',
    fontSize: layer.fontSize || 24,
    fontFamily: layer.fontFamily || 'Poppins',
    fontStyle: layer.fontStyle || 'normal',
    lineHeight: layer.lineHeight || 1,
    letterSpacing: layer.letterSpacing || 0,
    padding: layer.padding || 0,
  });
  return {
    width: Math.max(20, Math.ceil(node.width()) + 2),
    height: Math.max(10, Math.ceil(node.height())),
  };
}
