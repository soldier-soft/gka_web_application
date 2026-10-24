// GKA Construction ERP - Production Entrypoint for Hostinger / Node.js
const path = require('path');
const fs = require('fs');

const serverDist = path.resolve(__dirname, 'server/dist/server.js');

if (!fs.existsSync(serverDist)) {
  console.error('[GKA ERP] Compiled server output not found at:', serverDist);
  console.error('[GKA ERP] Compiling TypeScript server now...');
  const { execSync } = require('child_process');
  execSync('npm run build:server', { stdio: 'inherit', cwd: __dirname });
}

console.log('[GKA ERP] Booting server from:', serverDist);
require(serverDist);
