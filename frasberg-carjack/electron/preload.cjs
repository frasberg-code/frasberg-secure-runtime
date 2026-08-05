// ── Frasberg Carjack — Electron Preload (Secure IPC Bridge) ────────────────────
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onMenuEvent: (callback) => {
    ipcRenderer.on('menu-event', (_e, event) => callback(event));
  },
  getVersion: () => ipcRenderer.invoke('app:version'),
  toggleFullscreen: () => ipcRenderer.send('window:fullscreen'),
});
