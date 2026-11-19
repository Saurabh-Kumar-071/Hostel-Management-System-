const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

// Find an available local port
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

// Wait for Next.js HTTP server to be ready
function waitForServer(url, maxRetries = 60, interval = 500) {
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

async function startServer(port) {
  const isPackaged = app.isPackaged;
  const standaloneDir = isPackaged
    ? path.join(process.resourcesPath, 'standalone')
    : path.join(__dirname, '..', '.next', 'standalone');

  const serverScript = path.join(standaloneDir, 'server.js');
  const nodeBinary = isPackaged ? process.execPath : process.execPath;

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: 'production',
  };

  if (isPackaged) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  serverProcess = spawn(nodeBinary, [serverScript], {
    cwd: standaloneDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[HostelOS Server]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[HostelOS Server Error]: ${data}`);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[HostelOS Server] Exited with code ${code}, signal ${signal}`);
  });
}

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'HostelOS - Hostel Management System',
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const url = `http://127.0.0.1:${port}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes(`127.0.0.1:${port}`) && !url.includes(`localhost:${port}`)) {
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
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        try {
          serverProcess.kill('SIGKILL');
        } catch (_) {}
      }, 2000);
    } catch (_) {}
    serverProcess = null;
  }
}

app.on('ready', async () => {
  try {
    const port = await getAvailablePort(3000);
    await startServer(port);
    await waitForServer(`http://127.0.0.1:${port}/login`);
    await createWindow(port);
  } catch (error) {
    console.error('Fatal initialization error:', error);
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
