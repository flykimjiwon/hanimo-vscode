// Render media/hanimo-logo.svg → icon.png (128×128).
//
// VS Code Marketplace expects a PNG (not SVG) icon, so we render once at
// build time. The source SVG is the canonical hanimo mark; this script
// just makes a marketplace-ready raster of it.
//
// Usage:
//   node scripts/build-icon.js
//   node scripts/build-icon.js --size 256
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const root = path.resolve(__dirname, '..');
const svgPath = path.join(root, 'media', 'hanimo-logo.svg');
const outPath = path.join(root, 'icon.png');

const sizeArgIdx = process.argv.indexOf('--size');
const size = sizeArgIdx > 0 ? parseInt(process.argv[sizeArgIdx + 1], 10) : 128;

const svg = fs.readFileSync(svgPath, 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: size },
  background: 'rgba(255,255,255,0)',
});
const png = resvg.render().asPng();
fs.writeFileSync(outPath, png);

console.log(`[icon] ${svgPath} → ${outPath} (${size}×${size}, ${(png.length / 1024).toFixed(1)} kB)`);
