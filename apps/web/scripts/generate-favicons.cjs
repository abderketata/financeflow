/**
 * Generate favicon PNG and ICO files using pure Node.js (no native dependencies).
 * Compatible with Node.js 14+.
 *
 * Run: node scripts/generate-favicons.mjs
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(__dirname, '..', 'public');

// ── Color palette (from brand) ──────────────────────────────────────
const BG_START = [0x25, 0x63, 0xEB]; // #2563EB
const BG_END   = [0x3B, 0x82, 0xF6]; // #3B82F6
const WHITE_95 = [0xFF, 0xFF, 0xFF, 242]; // white 0.95
const WHITE_90 = [0xFF, 0xFF, 0xFF, 230]; // white 0.9

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function gradientColor(x, y, size) {
  const t = (x + y) / (2 * size);
  return [
    lerp(BG_START[0], BG_END[0], t),
    lerp(BG_START[1], BG_END[1], t),
    lerp(BG_START[2], BG_END[2], t),
    255,
  ];
}

function dist(px, py, cx, cy) {
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

function drawRoundedRect(pixels, size, rx) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      // Check corners
      if (x < rx && y < rx) inside = dist(x, y, rx, rx) <= rx;
      else if (x >= size - rx && y < rx) inside = dist(x, y, size - rx - 1, rx) <= rx;
      else if (x < rx && y >= size - rx) inside = dist(x, y, rx, size - rx - 1) <= rx;
      else if (x >= size - rx && y >= size - rx) inside = dist(x, y, size - rx - 1, size - rx - 1) <= rx;

      if (inside) {
        const [r, g, b, a] = gradientColor(x, y, size);
        const idx = (y * size + x) * 4;
        pixels[idx] = r;
        pixels[idx + 1] = g;
        pixels[idx + 2] = b;
        pixels[idx + 3] = a;
      }
    }
  }
}

function blendPixel(pixels, size, x, y, color, opacity) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (y * size + x) * 4;
  const a = (color[3] || 255) * opacity / 255;
  const invA = 1 - a / 255;
  pixels[idx] = Math.min(255, Math.round(pixels[idx] * invA + color[0] * a / 255));
  pixels[idx + 1] = Math.min(255, Math.round(pixels[idx + 1] * invA + color[1] * a / 255));
  pixels[idx + 2] = Math.min(255, Math.round(pixels[idx + 2] * invA + color[2] * a / 255));
  pixels[idx + 3] = Math.min(255, Math.round(pixels[idx + 3] + a * (1 - pixels[idx + 3] / 255)));
}

function drawThickLine(pixels, size, x0, y0, x1, y1, color, thickness) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len * 2);
  const halfT = thickness / 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;

    for (let oy = -Math.ceil(halfT); oy <= Math.ceil(halfT); oy++) {
      for (let ox = -Math.ceil(halfT); ox <= Math.ceil(halfT); ox++) {
        const d = Math.sqrt(ox * ox + oy * oy);
        if (d <= halfT) {
          const opacity = d > halfT - 0.8 ? Math.max(0, (halfT - d) / 0.8) * 255 : 255;
          blendPixel(pixels, size, cx + ox, cy + oy, color, opacity);
        }
      }
    }
  }
}

function drawPolyline(pixels, size, points, color, thickness) {
  for (let i = 0; i < points.length - 1; i++) {
    drawThickLine(pixels, size, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], color, thickness);
  }
}

function createFavicon(size) {
  const pixels = Buffer.alloc(size * size * 4, 0);

  // Scale factors based on 32px reference
  const s = size / 32;
  const rx = Math.round(8 * s);

  // 1. Rounded rect background
  drawRoundedRect(pixels, size, rx);

  // 2. Growth arrow line
  const linePoints = [
    [8 * s, 24 * s],
    [14 * s, 16 * s],
    [19 * s, 19.5 * s],
    [25 * s, 11 * s],
  ];
  drawPolyline(pixels, size, linePoints, WHITE_95, Math.max(1.5, 2.4 * s));

  // 3. Arrow head
  const headPoints1 = [[22 * s, 10 * s], [26 * s, 9.5 * s]];
  const headPoints2 = [[26 * s, 9.5 * s], [25.5 * s, 13.5 * s]];
  drawPolyline(pixels, size, headPoints1, WHITE_90, Math.max(1.2, 2 * s));
  drawPolyline(pixels, size, headPoints2, WHITE_90, Math.max(1.2, 2 * s));

  return pixels;
}

// ── PNG encoder (minimal, valid) ─────────────────────────────────────
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(pixels, width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — raw pixel data with filter byte 0 (none) per row
  const rowLen = width * 4 + 1;
  const rawData = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    rawData[y * rowLen] = 0; // filter: none
    pixels.copy(rawData, y * rowLen + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IEND
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', iend),
  ]);
}

// ── ICO encoder ──────────────────────────────────────────────────────
function encodeIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;

  let dataOffset = headerSize + dirEntrySize * count;
  const parts = [Buffer.alloc(headerSize + dirEntrySize * count)];
  const header = parts[0];

  header.writeUInt16LE(0, 0);     // reserved
  header.writeUInt16LE(1, 2);     // type: ICO
  header.writeUInt16LE(count, 4); // image count

  const sizes = [16, 32];
  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const s = sizes[i] || 32;
    const off = headerSize + i * dirEntrySize;
    header.writeUInt8(s >= 256 ? 0 : s, off);     // width
    header.writeUInt8(s >= 256 ? 0 : s, off + 1); // height
    header.writeUInt8(0, off + 2);
    header.writeUInt8(0, off + 3);
    header.writeUInt16LE(1, off + 4);               // planes
    header.writeUInt16LE(32, off + 6);              // bpp
    header.writeUInt32LE(png.length, off + 8);      // size
    header.writeUInt32LE(dataOffset, off + 12);     // offset
    dataOffset += png.length;
    parts.push(png);
  }

  return Buffer.concat(parts);
}

// ── Generate all files ───────────────────────────────────────────────
const configs = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of configs) {
  const pixels = createFavicon(size);
  const png = encodePng(pixels, size, size);
  fs.writeFileSync(path.join(publicDir, name), png);
  console.log('OK ' + name + ' (' + size + 'x' + size + ')');
}

// ICO with 16 + 32
const ico16 = fs.readFileSync(path.join(publicDir, 'favicon-16x16.png'));
const ico32 = fs.readFileSync(path.join(publicDir, 'favicon-32x32.png'));
const ico = encodeIco([ico16, ico32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
console.log('OK favicon.ico');

console.log('\nAll favicons generated!');

