import { contextBridge, ipcRenderer } from 'electron';

// This exposes safe, controlled APIs to the React frontend
// React can call window.electronAPI.openExternal(url) etc.
contextBridge.exposeInMainWorld('electronAPI', {
    openExternal: (url) => ipcRenderer.send('open-external', url),
    platform: process.platform,
    isElectron: true
});