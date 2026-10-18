#!/usr/bin/env node
/**
 * Génère les icônes de l'application depuis la marque « Flux Financier ».
 *
 * Pourquoi un script plutôt que des PNG déposés à la main : la marque vit dans
 * `apps/web/src/assets/flux-financier-mark.svg` (et sa transposition RN
 * `src/components/ui/BrandLogo.tsx`). Redessiner la même géométrie ici permet
 * de régénérer toutes les tailles quand la marque bouge, sans dépendre d'un
 * rasteriseur SVG (sharp/librsvg) absent du projet.
 *
 * Le tracé est rendu par échantillonnage : chaque pixel de sortie moyenne
 * SUPERSAMPLE² points, ce qui donne l'anticrénelage sans bibliothèque graphique.
 *
 * Usage : node scripts/generate-app-icons.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assetsDir = path.resolve(__dirname, '..', 'assets');

/** Repères de la marque, en coordonnées du viewBox 160×160 du SVG d'origine. */
const MARK = {
  viewBox: 160,
  // Carré arrondi : c'est lui qui définit la « boîte » de la marque.
  card: { x: 8, y: 8, size: 144, radius: 36 },
  background: { from: '#2563EB', to: '#3B82F6', x1: 0, y1: 0, x2: 160, y2: 160 },
  veil: { color: '#FFFFFF', alpha: 0.06 },
  // Courbe ascendante (flux / croissance) puis pointe de flèche.
  curve: {
    points: [
      [48, 112],
      [80, 72],
      [100, 88],
      [120, 52],
    ],
    width: 6,
    from: { color: '#FFFFFF', alpha: 0.95 },
    to: { color: '#DBEAFE', alpha: 0.9 },
    x1: 50,
    y1: 110,
    x2: 110,
    y2: 50,
  },
  arrowHead: {
    points: [
      [108, 50],
      [122, 48],
      [120, 62],
    ],
    width: 5,
    color: '#FFFFFF',
    alpha: 0.9,
  },
  // Socle (équilibre / stabilité).
  base: { x: 44, y: 124, width: 72, height: 5, radius: 2.5, color: '#FFFFFF', alpha: 0.35 },
};

const SUPERSAMPLE = 3;

const hexToRgb = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Position (0 → 1) d'un point le long d'un dégradé linéaire. */
const gradientPosition = (x, y, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  return lengthSquared === 0 ? 0 : clamp01(((x - x1) * dx + (y - y1) * dy) / lengthSquared);
};

const insideRoundedRect = (px, py, x, y, width, height, radius) => {
  if (px < x || py < y || px > x + width || py > y + height) {
    return false;
  }

  // Hors des quatre coins, un rectangle arrondi est un rectangle.
  const dx = Math.max(x + radius - px, 0, px - (x + width - radius));
  const dy = Math.max(y + radius - py, 0, py - (y + height - radius));
  return dx * dx + dy * dy <= radius * radius;
};

const distanceToSegment = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : clamp01(((px - ax) * dx + (py - ay) * dy) / lengthSquared);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
};

/** Un trait de largeur `width` aux extrémités et jonctions rondes : distance ≤ moitié. */
const insidePolylineStroke = (px, py, points, width) => {
  const half = width / 2;

  for (let index = 0; index < points.length - 1; index += 1) {
    if (distanceToSegment(px, py, points[index], points[index + 1]) <= half) {
      return true;
    }
  }

  return false;
};

/** Composite `src` (avec alpha) au-dessus de `dst`, en place. */
const blend = (dst, r, g, b, alpha) => {
  if (alpha <= 0) {
    return;
  }

  const outAlpha = alpha + dst.a * (1 - alpha);
  if (outAlpha === 0) {
    dst.r = dst.g = dst.b = dst.a = 0;
    return;
  }

  dst.r = (r * alpha + dst.r * dst.a * (1 - alpha)) / outAlpha;
  dst.g = (g * alpha + dst.g * dst.a * (1 - alpha)) / outAlpha;
  dst.b = (b * alpha + dst.b * dst.a * (1 - alpha)) / outAlpha;
  dst.a = outAlpha;
};

const BACKGROUND_FROM = hexToRgb(MARK.background.from);
const BACKGROUND_TO = hexToRgb(MARK.background.to);
const VEIL = hexToRgb(MARK.veil.color);
const CURVE_FROM = hexToRgb(MARK.curve.from.color);
const CURVE_TO = hexToRgb(MARK.curve.to.color);
const ARROW_HEAD = hexToRgb(MARK.arrowHead.color);
const BASE = hexToRgb(MARK.base.color);

/**
 * Couleur d'un point exprimé dans le repère de la marque (0 → 160).
 *
 * @param options.background 'gradient' (dégradé de la marque), 'none' (transparent)
 * @param options.rounded    limite le fond au carré arrondi (sinon plein cadre)
 * @param options.monochrome rend le motif en blanc opaque (icône de notification)
 */
const sampleMark = (x, y, options) => {
  const pixel = { r: 0, g: 0, b: 0, a: 0 };
  const { card } = MARK;
  const insideCard = insideRoundedRect(x, y, card.x, card.y, card.size, card.size, card.radius);

  if (options.background === 'gradient' && (!options.rounded || insideCard)) {
    const t = gradientPosition(x, y, MARK.background.x1, MARK.background.y1, MARK.background.x2, MARK.background.y2);
    blend(
      pixel,
      lerp(BACKGROUND_FROM.r, BACKGROUND_TO.r, t),
      lerp(BACKGROUND_FROM.g, BACKGROUND_TO.g, t),
      lerp(BACKGROUND_FROM.b, BACKGROUND_TO.b, t),
      1,
    );
    blend(pixel, VEIL.r, VEIL.g, VEIL.b, MARK.veil.alpha);
  }

  if (options.motif === false) {
    return pixel;
  }

  if (insidePolylineStroke(x, y, MARK.curve.points, MARK.curve.width)) {
    if (options.monochrome) {
      blend(pixel, 255, 255, 255, 1);
    } else {
      const t = gradientPosition(x, y, MARK.curve.x1, MARK.curve.y1, MARK.curve.x2, MARK.curve.y2);
      blend(
        pixel,
        lerp(CURVE_FROM.r, CURVE_TO.r, t),
        lerp(CURVE_FROM.g, CURVE_TO.g, t),
        lerp(CURVE_FROM.b, CURVE_TO.b, t),
        lerp(MARK.curve.from.alpha, MARK.curve.to.alpha, t),
      );
    }
  }

  if (insidePolylineStroke(x, y, MARK.arrowHead.points, MARK.arrowHead.width)) {
    blend(pixel, ARROW_HEAD.r, ARROW_HEAD.g, ARROW_HEAD.b, options.monochrome ? 1 : MARK.arrowHead.alpha);
  }

  const { base } = MARK;
  if (insideRoundedRect(x, y, base.x, base.y, base.width, base.height, base.radius)) {
    blend(pixel, BASE.r, BASE.g, BASE.b, options.monochrome ? 1 : base.alpha);
  }

  return pixel;
};

/**
 * Rend un PNG carré.
 *
 * @param options.contentBox portion du canvas (0 → 1) occupée par la boîte de la
 *   marque. 1 = plein cadre (icône iOS/Android classique), 0,64 = zone sûre d'une
 *   icône adaptative Android, dont les bords sont rognés par le lanceur.
 */
const render = (size, options) => {
  const png = new PNG({ width: size, height: size });
  const contentBox = options.contentBox ?? 1;
  // La boîte de la marque (card) est mappée sur `contentBox` du canvas.
  const scale = (size * contentBox) / MARK.card.size;
  const offset = size * (1 - contentBox) * 0.5 - MARK.card.x * scale;
  const step = 1 / SUPERSAMPLE;
  const samplesPerPixel = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const canvasX = px + (sx + 0.5) * step;
          const canvasY = py + (sy + 0.5) * step;
          const markX = (canvasX - offset) / scale;
          const markY = (canvasY - offset) / scale;
          const sample = sampleMark(markX, markY, options);

          // Prémultiplication : sinon la couleur des pixels de bord est tirée
          // vers celle des échantillons transparents.
          r += sample.r * sample.a;
          g += sample.g * sample.a;
          b += sample.b * sample.a;
          a += sample.a;
        }
      }

      const index = (py * size + px) * 4;
      const alpha = a / samplesPerPixel;
      png.data[index] = alpha === 0 ? 0 : Math.round(r / a);
      png.data[index + 1] = alpha === 0 ? 0 : Math.round(g / a);
      png.data[index + 2] = alpha === 0 ? 0 : Math.round(b / a);
      png.data[index + 3] = Math.round(alpha * 255);
    }
  }

  return png;
};

const write = (fileName, png) => {
  const target = path.join(assetsDir, fileName);
  fs.writeFileSync(target, PNG.sync.write(png));
  const { size } = fs.statSync(target);
  console.log(`  ${fileName.padEnd(30)} ${png.width}×${png.height}  ${(size / 1024).toFixed(1)} Ko`);
};

const targets = [
  // Icône principale : plein cadre, le système applique lui-même son masque.
  ['icon.png', 1024, { background: 'gradient', rounded: false }],
  // Icône adaptative Android : motif seul dans la zone sûre, fond fourni à part.
  ['adaptive-icon.png', 1024, { background: 'none', contentBox: 0.64 }],
  ['adaptive-icon-background.png', 1024, { background: 'gradient', rounded: false, motif: false }],
  // Notification Android : Android n'en garde que la silhouette, blanche.
  ['notification-icon.png', 96, { background: 'none', monochrome: true, contentBox: 0.78 }],
  // Écran de démarrage et favicon du build web : marque sur fond transparent.
  ['splash-icon.png', 512, { background: 'gradient', rounded: true }],
  ['favicon.png', 64, { background: 'gradient', rounded: true }],
];

fs.mkdirSync(assetsDir, { recursive: true });
console.log(`Génération des icônes dans ${assetsDir}`);
targets.forEach(([fileName, size, options]) => write(fileName, render(size, options)));
console.log('Terminé.');
