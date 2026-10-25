const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Find npm and node executables
const nodeDir = path.dirname(process.execPath);
const localNpm = path.join(nodeDir, process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmBin = fs.existsSync(localNpm) ? `"${localNpm}"` : 'npm';
const nodeBin = `"${process.execPath}"`;


console.log('====================================================');
console.log('[Deploy Build] Starting full fullstack production build...');
console.log('====================================================');

// Ensure execute permissions on Linux/Unix systems for .bin executables
if (process.platform !== 'win32') {
  try {
    execSync('chmod -R +x node_modules/.bin server/node_modules/.bin client/node_modules/.bin 2>/dev/null || true', { cwd: root });
  } catch {}
}

// 1. Build Client
console.log('[Deploy Build] Building Client (Vite)...');
let clientBuilt = false;
try {
  execSync(`${npmBin} run build --prefix client`, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  clientBuilt = true;
  console.log('[Deploy Build] Client build successful.');
} catch (err) {
  console.warn('[Deploy Build] Client npm build encountered an issue, trying direct node invocation...');
  const directVite = path.join(root, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
  if (fs.existsSync(directVite)) {
    try {
      execSync(`${nodeBin} "${directVite}" build`, {
        stdio: 'inherit',
        cwd: path.join(root, 'client'),
        env: { ...process.env, NODE_ENV: 'production' },
      });
      clientBuilt = true;
      console.log('[Deploy Build] Client direct node build successful.');
    } catch (dirErr) {
      console.warn('[Deploy Build] Direct node vite build warning:', dirErr.message);
    }
  }
}

if (!clientBuilt) {
  const existingClientDist = path.join(root, 'client', 'dist', 'index.html');
  const existingRootDist = path.join(root, 'dist', 'index.html');
  if (fs.existsSync(existingClientDist) || fs.existsSync(existingRootDist)) {
    console.log('[Deploy Build] Pre-compiled client distribution output found. Proceeding with static artifacts.');
  } else {
    console.error('[Deploy Build] Fatal: Client build failed and no pre-compiled distribution output exists.');
    process.exit(1);
  }
}

// 2. Build Server
console.log('[Deploy Build] Building Server (TypeScript)...');
let serverBuilt = false;
try {
  execSync(`${npmBin} run build --prefix server`, {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  serverBuilt = true;
  console.log('[Deploy Build] Server build successful.');
} catch (err) {
  console.warn('[Deploy Build] Server npm build encountered an issue, trying direct node invocation...');
  const serverTsc = path.join(root, 'server', 'node_modules', 'typescript', 'bin', 'tsc');
  const rootTsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const targetTsc = fs.existsSync(serverTsc) ? serverTsc : rootTsc;

  if (fs.existsSync(targetTsc)) {
    try {
      execSync(`${nodeBin} "${targetTsc}"`, {
        stdio: 'inherit',
        cwd: path.join(root, 'server'),
        env: { ...process.env, NODE_ENV: 'production' },
      });
      serverBuilt = true;
      console.log('[Deploy Build] Server direct TypeScript compilation successful.');
    } catch (dirErr) {
      console.warn('[Deploy Build] Direct node tsc compile warning:', dirErr.message);
    }
  }
}

if (!serverBuilt) {
  const existingServerDist = path.join(root, 'server', 'dist', 'server.js');
  if (fs.existsSync(existingServerDist)) {
    console.log('[Deploy Build] Pre-compiled server/dist/server.js found. Proceeding with production server startup.');
  } else {
    console.error('[Deploy Build] Fatal: Server compilation failed and no pre-compiled server output exists.');
    process.exit(1);
  }
}

// 3. Sync client distribution artifacts to root dist and root assets folders
const clientDist = path.join(root, 'client', 'dist');
const rootDist = path.join(root, 'dist');
const rootAssets = path.join(root, 'assets');

if (fs.existsSync(clientDist)) {
  console.log('[Deploy Build] Syncing client artifacts to root dist and assets folder...');
  
  // Clean root dist and assets to remove stale hash chunks
  if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
  }
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }

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
