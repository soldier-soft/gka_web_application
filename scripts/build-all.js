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

// 3. Sync client distribution artifacts to root dist and root assets folders
const clientDist = path.join(root, 'client', 'dist');
const rootDist = path.join(root, 'dist');
const rootAssets = path.join(root, 'assets');

if (fs.existsSync(clientDist)) {
  console.log('[Deploy Build] Syncing client artifacts to root dist and assets folder...');
  fs.cpSync(clientDist, rootDist, { recursive: true });
  const clientAssets = path.join(clientDist, 'assets');
  if (fs.existsSync(clientAssets)) {
    fs.cpSync(clientAssets, rootAssets, { recursive: true });
  }

  // Also sync essential root static entry points
  const rootFiles = ['index.html', 'logo.png', 'robots.txt', 'sitemap.xml'];
  for (const file of rootFiles) {
    const srcFile = path.join(clientDist, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(root, file));
    }
  }

  console.log('[Deploy Build] Static output ready at client/dist, root dist, root assets, and project root.');
}

console.log('====================================================');
console.log('[Deploy Build] Fullstack build complete! All artifacts ready.');
console.log('====================================================');
