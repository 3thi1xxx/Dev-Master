const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchPulse: () => ipcRenderer.invoke('fetch-pulse')
});