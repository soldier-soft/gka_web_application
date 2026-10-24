const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Find the npm executable co-located with node or on PATH
const nodeDir = path.dirname(process.execPath);
const localNpm = path.join(nodeDir, process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmBin = fs.existsSync(localNpm) ? `"${localNpm}"` : 'npm';

// Force development environment for npm install so all dependencies are installed even if host sets NODE_ENV=production
const installEnv = {
  ...process.env,
  NODE_ENV: 'development',
};

console.log('----------------------------------------------------');
console.log(`[Deploy Postinstall] Using npm binary: ${npmBin}`);
console.log('[Deploy Postinstall] Installing client dependencies (including all build tools)...');
console.log('----------------------------------------------------');
try {
  execSync(`${npmBin} install --prefix client --include=dev`, {
    stdio: 'inherit',
    cwd: root,
    env: installEnv,
  });
} catch (err) {
  console.error('[Deploy Postinstall] Error installing client dependencies:', err.message);
  process.exit(1);
}

console.log('----------------------------------------------------');
console.log('[Deploy Postinstall] Installing server dependencies...');
console.log('----------------------------------------------------');
try {
  execSync(`${npmBin} install --prefix server --include=dev`, {
    stdio: 'inherit',
    cwd: root,
    env: installEnv,
  });
} catch (err) {
  console.warn('[Deploy Postinstall] Server dependencies note:', err.message);
}

console.log('----------------------------------------------------');
console.log('[Deploy Postinstall] Dependencies installation finished.');
console.log('----------------------------------------------------');
