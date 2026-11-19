const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const envSrc = path.join(rootDir, '.env.local');
const envDest = path.join(standaloneDir, '.env.local');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

console.log('[Prepare] Syncing static and configuration assets to standalone directory...');

if (!fs.existsSync(standaloneDir)) {
  console.error('[Prepare Error] .next/standalone does not exist. Please run next build first.');
  process.exit(1);
}

// 1. Copy static assets
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('[Prepare] Copied .next/static -> .next/standalone/.next/static');
}

// 2. Copy .env.local
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDest);
  console.log('[Prepare] Copied .env.local -> .next/standalone/.env.local');
}

// 3. Copy public directory if present
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  console.log('[Prepare] Copied public -> .next/standalone/public');
}

console.log('[Prepare] Standalone bundle prepared successfully.');
