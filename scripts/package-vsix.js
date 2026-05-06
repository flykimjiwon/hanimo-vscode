// Builds platform-specific .vsix files. Each contains only the binary for
// that target — bundling 4 binaries into one .vsix wastes ~75% of the
// payload for any given user. We rewrite .vscodeignore for each target so
// vsce only packages the relevant binary.
//
// Usage:
//   node scripts/package-vsix.js                      # all 4 targets
//   node scripts/package-vsix.js darwin-arm64         # one target
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const TARGETS = ['darwin-arm64', 'darwin-x64', 'win32-x64', 'linux-x64'];

const args = process.argv.slice(2);
const requestedTargets = args.filter((a) => !a.startsWith('--'));

const baseIgnore = fs.readFileSync(path.join(root, '.vscodeignore'), 'utf8');

function packageOne(target) {
  const ext = target === 'win32-x64' ? '.exe' : '';
  const keepBinary = `bin/hanimo-server-${target}${ext}`;
  const binPath = path.join(root, keepBinary);
  if (!fs.existsSync(binPath)) {
    throw new Error(`binary not found: ${binPath}. Run: node scripts/build-server.js`);
  }

  const tempIgnore = baseIgnore + '\n# generated\nbin/**\n!' + keepBinary + '\n';
  fs.writeFileSync(path.join(root, '.vscodeignore'), tempIgnore);
  try {
    const outName = `hanimo-vscode-${target}.vsix`;
    console.log(`\n[package] ${target} → ${outName}`);
    execSync(`npx vsce package --target ${target} --out ${outName}`, {
      cwd: root, stdio: 'inherit',
    });
    const outPath = path.join(root, outName);
    const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
    console.log(`[package] ${outName} — ${size} MB`);
  } finally {
    fs.writeFileSync(path.join(root, '.vscodeignore'), baseIgnore);
  }
}

const list = requestedTargets.length > 0 ? requestedTargets : TARGETS;
for (const t of list) {
  if (!TARGETS.includes(t)) {
    console.error(`Unknown target ${t}. Valid: ${TARGETS.join(', ')}`);
    process.exit(1);
  }
}
for (const t of list) packageOne(t);
console.log(`\n[package] done. ${list.length} .vsix file(s).`);
