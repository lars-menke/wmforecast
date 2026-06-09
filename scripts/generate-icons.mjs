/**
 * Generates apple-touch-icon.png (180x180) and favicon.png from trophy.png.
 *
 * Usage:
 *   1. Copy your trophy PNG to public/trophy.png
 *   2. npm install --save-dev sharp   (one-time)
 *   3. node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public', 'trophy.png');

if (!existsSync(src)) {
  console.error('❌  public/trophy.png not found. Place the trophy image there first.');
  process.exit(1);
}

const bgDark  = { r: 6,  g: 9,  b: 26,  alpha: 1 };  // #06091A night-navy
const bgLight = { r: 245, g: 241, b: 234, alpha: 1 }; // #F5F1EA warm off-white

async function makeIcon(bg, outFile, size = 180) {
  const padding = Math.round(size * 0.12);
  const inner   = size - padding * 2;

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{
      input: await sharp(src).resize(inner, inner, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0} }).toBuffer(),
      top: padding,
      left: padding,
    }])
    .png()
    .toFile(join(root, 'public', outFile));

  console.log(`✅  public/${outFile} (${size}x${size})`);
}

await makeIcon(bgDark,  'apple-touch-icon.png',       180);
await makeIcon(bgDark,  'apple-touch-icon-dark.png',  180);
await makeIcon(bgLight, 'apple-touch-icon-light.png', 180);
await makeIcon(bgDark,  'favicon-192.png',            192);
