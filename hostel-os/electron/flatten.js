const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function flattenStandalone(standaloneDir) {
  const nmDir = path.join(standaloneDir, 'node_modules');
  const pnpmDir = path.join(nmDir, '.pnpm');
  if (!fs.existsSync(pnpmDir)) {
    console.log('[Flatten] No .pnpm directory found, skipping.');
    return;
  }

  const dirs = fs.readdirSync(pnpmDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'node_modules');

  console.log(`[Flatten] Processing ${dirs.length} packages from .pnpm into flat node_modules...`);

  for (const d of dirs) {
    const srcNm = path.join(pnpmDir, d.name, 'node_modules');
    if (!fs.existsSync(srcNm)) continue;
    const items = fs.readdirSync(srcNm);
    for (const item of items) {
      if (item.startsWith('.')) continue;
      const itemPath = path.join(srcNm, item);
      if (item.startsWith('@')) {
        const scopeDir = path.join(nmDir, item);
        fs.mkdirSync(scopeDir, { recursive: true });
        const subItems = fs.readdirSync(itemPath);
        for (const sub of subItems) {
          const subSrc = path.join(itemPath, sub);
          const subDest = path.join(scopeDir, sub);
          const pkgJson = path.join(subDest, 'package.json');
          if (!fs.existsSync(pkgJson)) {
            try {
              execSync(`robocopy "${subSrc}" "${subDest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1`, { stdio: 'ignore' });
            } catch (_) {}
          }
        }
      } else {
        const dest = path.join(nmDir, item);
        const pkgJson = path.join(dest, 'package.json');
        if (!fs.existsSync(pkgJson)) {
          try {
            execSync(`robocopy "${itemPath}" "${dest}" /E /NFL /NDL /NJH /NJS /R:1 /W:1`, { stdio: 'ignore' });
          } catch (_) {}
        }
      }
    }
  }

  console.log('[Flatten] Standalone node_modules successfully flattened.');
}

if (require.main === module) {
  const target = process.argv[2] || path.resolve(__dirname, '..', 'dist', 'HostelOS-win32-x64', 'resources', 'standalone');
  flattenStandalone(target);
}

module.exports = { flattenStandalone };
