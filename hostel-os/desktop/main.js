const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

// Hardware acceleration and sandbox bypass for rock-solid stability on all Windows machines
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.disableHardwareAcceleration();

let mainWindow = null;
let serverProcess = null;

function getAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, maxRetries = 100, interval = 300) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get(url, (res) => {
        resolve();
      });
      req.on('error', (err) => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`HostelOS server failed to initialize at ${url}`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
      });
    };
    check();
  });
}

function findStandaloneDir() {
  const candidates = [
    path.join(process.resourcesPath, 'standalone'),
    path.join(path.dirname(app.getAppPath()), 'standalone'),
    path.resolve(__dirname, '..', 'standalone'),
    path.resolve(__dirname, '..', '.next', 'standalone'),
    path.resolve(__dirname, '..', '..', '.next', 'standalone'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'server.js'))) {
      return c;
    }
  }
  return candidates[0];
}

async function startServer(port) {
  const standaloneDir = findStandaloneDir();
  const serverScript = path.join(standaloneDir, 'server.js');
  const nodeBinary = process.execPath;

  let serverErrorOutput = '';
  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1',
    NODE_PATH: path.join(standaloneDir, 'node_modules'),
  };

  serverProcess = spawn(nodeBinary, [serverScript], {
    cwd: standaloneDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (d) => console.log(`[HostelOS Server]: ${d}`));
  serverProcess.stderr.on('data', (d) => {
    serverErrorOutput += d.toString();
    console.error(`[HostelOS Server Error]: ${d}`);
  });
  serverProcess.on('exit', (code, sig) => {
    console.log(`[HostelOS Server] Exited: ${code}, ${sig}`);
    if (code !== null && code !== 0 && !app.isQuitting) {
      dialog.showErrorBox(
        'HostelOS Server Error',
        `The local platform server stopped unexpectedly (exit code ${code}).\n\n${serverErrorOutput.slice(-500)}`
      );
    }
  });
}

function getLoadingHtml() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HostelOS - Launching</title>
  <style>
    * { box-sizing: border-box; }
    body {
      background: #090d16;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      user-select: none;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .icon {
      width: 44px;
      height: 44px;
      background: #2563eb;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .icon svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: white;
      stroke-width: 2.2;
    }
    .title {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #1e293b;
      border-top: 3px solid #38bdf8;
      border-radius: 50%;
      animation: spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="brand">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
    <div class="title">HostelOS</div>
  </div>
  <div class="spinner"></div>
  <div class="subtitle">Starting local application services...</div>
</body>
</html>
`)}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'HostelOS - Residential Hostel Management Platform',
    autoHideMenuBar: true,
    show: true,
    backgroundColor: '#090d16',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  await mainWindow.loadURL(getLoadingHtml());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (_) {}
    serverProcess = null;
  }
}

app.on('ready', async () => {
  try {
    await createWindow();
    const port = await getAvailablePort(3000);
    await startServer(port);
    await waitForServer(`http://127.0.0.1:${port}/login`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    }
  } catch (err) {
    console.error('Fatal initialization error:', err);
    dialog.showErrorBox('HostelOS Initialization Error', err.message || 'Failed to start local server');
    app.quit();
  }
});

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanup();
});

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
