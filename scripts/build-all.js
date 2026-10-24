const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Find npm executable
const nodeDir = path.dirname(process.execPath);
const localNpm = path.join(nodeDir, process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmBin = fs.existsSync(localNpm) ? `"${localNpm}"` : 'npm';

console.log('====================================================');
console.log('[Deploy Build] Starting full fullstack production build...');
console.log('====================================================');

// 1. Build Client
console.log('[Deploy Build] Building Client (Vite)...');
try {
  execSync(`${npmBin} run build --prefix client`, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  console.log('[Deploy Build] Client build successful.');
} catch (err) {
  console.error('[Deploy Build] Client build failed:', err.message);
  process.exit(1);
}

// 2. Build Server
console.log('[Deploy Build] Building Server (TypeScript)...');
try {
  execSync(`${npmBin} run build --prefix server`, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  console.log('[Deploy Build] Server build successful.');
} catch (err) {
  console.error('[Deploy Build] Server build failed:', err.message);
  process.exit(1);
}

console.log('====================================================');
console.log('[Deploy Build] Fullstack build complete! All artifacts ready.');
console.log('====================================================');
