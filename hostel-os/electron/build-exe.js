const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appOutDir = path.join(distDir, 'HostelOS-win32-x64');
const resourcesDir = path.join(appOutDir, 'resources');
const appDir = path.join(resourcesDir, 'app');
const standaloneDest = path.join(resourcesDir, 'standalone');

function safeRobocopy(src, dest, excludeFiles = []) {
  const xf = excludeFiles.length ? `/XF ${excludeFiles.join(' ')}` : '';
  try {
    execSync(`robocopy "${src}" "${dest}" /E /SJ /SL /NFL /NDL /NJH /NJS /R:2 /W:2 ${xf}`, { stdio: 'inherit' });
  } catch (err) {
    // Robocopy exits with 1-7 for successful copy operations
    if (err.status && err.status <= 7) {
      return;
    }
    throw err;
  }
}

console.log('[Build] Step 1: Preparing Next.js standalone assets...');
execSync(`node "${path.join(__dirname, 'prepare.js')}"`, { stdio: 'inherit', cwd: rootDir });

console.log('[Build] Step 2: Locating Electron binaries...');
const electronExePath = require('electron');
const electronDistDir = path.dirname(electronExePath);

console.log(`[Build] Electron dist located at: ${electronDistDir}`);

console.log('[Build] Step 3: Ensuring output directory exists at:', appOutDir);
fs.mkdirSync(appOutDir, { recursive: true });

console.log('[Build] Step 4: Syncing Electron runtime...');
// Exclude electron.exe and default_app.asar from robocopy
safeRobocopy(electronDistDir, appOutDir, ['electron.exe', 'default_app.asar']);

console.log('[Build] Step 5: Setting up HostelOS.exe binary...');
const sourceElectron = path.join(electronDistDir, 'electron.exe');
const targetExe = path.join(appOutDir, 'HostelOS.exe');

// Terminate any running instance of HostelOS.exe before modifying
try {
  execSync('taskkill /F /IM HostelOS.exe', { stdio: 'ignore' });
} catch (_) {}

if (fs.existsSync(targetExe)) {
  const srcSize = fs.statSync(sourceElectron).size;
  const destSize = fs.statSync(targetExe).size;
  if (srcSize === destSize) {
    console.log('[Build] HostelOS.exe is already up-to-date and ready.');
  } else {
    try { fs.unlinkSync(targetExe); } catch (_) {}
    fs.copyFileSync(sourceElectron, targetExe);
  }
} else {
  fs.copyFileSync(sourceElectron, targetExe);
}

// Ensure no leftover electron.exe remains
const leftoverElectron = path.join(appOutDir, 'electron.exe');
if (fs.existsSync(leftoverElectron)) {
  try { fs.unlinkSync(leftoverElectron); } catch (_) {}
}

console.log('[Build] Step 6: Creating Electron application bundle in resources/app...');
const defaultAsar = path.join(resourcesDir, 'default_app.asar');
if (fs.existsSync(defaultAsar)) {
  try { fs.unlinkSync(defaultAsar); } catch (_) {}
}
fs.mkdirSync(appDir, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'desktop', 'package.json'), path.join(appDir, 'package.json'));
fs.copyFileSync(path.join(rootDir, 'desktop', 'main.js'), path.join(appDir, 'main.js'));
fs.copyFileSync(path.join(rootDir, 'desktop', 'preload.js'), path.join(appDir, 'preload.js'));

console.log('[Build] Step 7: Packaging Next.js standalone server into resources/standalone...');
const standaloneSrc = path.join(rootDir, '.next', 'standalone');
safeRobocopy(standaloneSrc, standaloneDest);

console.log('[Build] Step 8: Flattening production dependencies for portable execution...');
const { flattenStandalone } = require('./flatten');
flattenStandalone(standaloneDest);

console.log('[Build] Verification...');
if (fs.existsSync(targetExe) && fs.existsSync(path.join(appDir, 'main.js')) && fs.existsSync(path.join(standaloneDest, 'server.js'))) {
  const stats = fs.statSync(targetExe);
  console.log('================================================================');
  console.log(' SUCCESS! HostelOS Windows Executable Built Successfully!');
  console.log(` Executable Path: ${targetExe}`);
  console.log(` Executable Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('================================================================');
} else {
  console.error('[Build Error] Verification failed. Missing executable or critical files.');
  process.exit(1);
}
