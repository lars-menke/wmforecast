/**
 * Generates the full PWA icon set from src/assets/trophy-new.png.
 *
 * Output (all in public/):
 *   - apple-touch-icon.png   180x180  opaque, no alpha (iOS applies its own mask)
 *   - icon-192.png           192x192  opaque, manifest "any"
 *   - icon-512.png           512x512  opaque, manifest "any"
 *   - maskable-icon-512.png  512x512  opaque, extra padding for Android's safe zone
 *   - favicon-32.png          32x32   opaque, browser tab
 *
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'src', 'assets', 'trophy-new.png');

const bg = { r: 6, g: 9, b: 26, alpha: 1 }; // #06091A night-navy

async function makeIcon(outFile, size, paddingRatio) {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{
      input: await sharp(src).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
      top: padding,
      left: padding,
    }])
    // flatten drops the alpha channel so iOS doesn't render transparent
    // corners as black when it applies its own rounded mask
    .flatten({ background: bg })
    .png()
    .toFile(join(root, 'public', outFile));

  console.log(`done public/${outFile} (${size}x${size})`);
}

await makeIcon('apple-touch-icon.png', 180, 0.12);
await makeIcon('icon-192.png', 192, 0.12);
await makeIcon('icon-512.png', 512, 0.12);
// Android's adaptive-icon mask crops to a circle covering ~80% of the
// canvas, so the artwork needs to live within the center ~66% safe zone.
await makeIcon('maskable-icon-512.png', 512, 0.17);
await makeIcon('favicon-32.png', 32, 0.1);
