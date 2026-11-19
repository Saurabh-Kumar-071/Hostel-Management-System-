const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('hostelDesktop', {
  platform: process.platform,
  version: '1.0.0',
  isElectron: true,
});
