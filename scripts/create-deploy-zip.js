const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const zipFile = path.join(root, 'gka-deploy.zip');

console.log('====================================================');
console.log('[Deploy Package] Creating clean deployment archive (gka-deploy.zip)...');
console.log('====================================================');

// Remove existing archive if present
if (fs.existsSync(zipFile)) {
  try {
    fs.unlinkSync(zipFile);
    console.log('[Deploy Package] Removed previous gka-deploy.zip');
  } catch (e) {}
}

// Stage clean deployment files into a temporary staging folder
const stagingDir = path.join(root, '.deploy-staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

const filesToCopy = [
  'package.json',
  'package-lock.json',
  'server.js',
  'index.js',
  'app.js',
  'index.html',
  'logo.png',
  'robots.txt',
  'sitemap.xml',
  '.htaccess',
  '.env',
  '.env.example',
];

for (const file of filesToCopy) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stagingDir, file));
  }
}

// Directories to copy cleanly (excluding node_modules)
const dirsToCopy = [
  'dist',
  'assets',
  'scripts',
  'server',
  'client',
  'shared',
];

for (const dir of dirsToCopy) {
  const srcDir = path.join(root, dir);
  const destDir = path.join(stagingDir, dir);
  if (fs.existsSync(srcDir)) {
    fs.cpSync(srcDir, destDir, {
      recursive: true,
      filter: (src) => {
        const basename = path.basename(src);
        // Exclude all node_modules, git, and zip files
        if (basename === 'node_modules' || basename === '.git' || basename.endsWith('.zip') || basename.endsWith('.log')) {
          return false;
        }
        return true;
      },
    });
  }
}

console.log('[Deploy Package] Staging complete. Compressing to gka-deploy.zip...');

// Locate powershell executable
const powershellCandidates = [
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  'C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe',
  'powershell.exe',
];
const powershellBin = powershellCandidates.find((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}) || 'powershell.exe';

try {
  const psCmd = `"${powershellBin}" -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFile}' -Force"`;
  execSync(psCmd, { stdio: 'inherit', cwd: root });
  console.log(`[Deploy Package] Success! Deployment zip created at: ${zipFile}`);
  const stats = fs.statSync(zipFile);
  console.log(`[Deploy Package] Archive size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (Clean, ready for Hostinger upload!)`);
} catch (err) {
  console.error('[Deploy Package] Compression failed:', err.message);
} finally {
  // Clean up staging directory
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

console.log('====================================================');
console.log('[Deploy Package] Done! Upload gka-deploy.zip to Hostinger and extract.');
console.log('====================================================');
