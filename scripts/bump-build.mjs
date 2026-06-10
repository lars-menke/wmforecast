import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const match = pkg.version.match(/^(\d+\.\d+\.\d+)\s*\(Build\s*(\d+)\)$/);

if (!match) {
  console.error('Version format not recognized:', pkg.version);
  process.exit(1);
}

const semver = match[1];
const build  = parseInt(match[2], 10) + 1;
pkg.version  = `${semver} (Build ${String(build).padStart(2, '0')})`;

writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`Build bumped to: ${pkg.version}`);
