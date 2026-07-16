import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * Generate PWA icon PNGs from an inline SVG (brand: teal rounded tile with a
 * white crescent + "H"). Run once: pnpm tsx scripts/gen-icons.ts
 * Output: public/icons/{icon-192,icon-512,icon-maskable-512}.png
 */
const OUT_DIR = join(process.cwd(), 'public', 'icons');

function svg(size: number, maskable: boolean): string {
  // maskable needs ~20% safe padding around the glyph
  const pad = maskable ? size * 0.1 : size * 0.06;
  const r = maskable ? 0 : size * 0.22; // full-bleed for maskable, rounded otherwise
  const cx = size / 2;
  const glyph = size * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0f766e"/>
  <g transform="translate(${cx}, ${cx + size * 0.02})">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="${glyph}" font-weight="700"
          fill="#ffffff" text-anchor="middle" dominant-baseline="central">☪</text>
  </g>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" fill="none"/>
</svg>`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const targets = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
  ];
  for (const t of targets) {
    await sharp(Buffer.from(svg(t.size, t.maskable))).png().toFile(join(OUT_DIR, t.name));
    console.log(`wrote public/icons/${t.name}`);
  }
  console.log('Icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
