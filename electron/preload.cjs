const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    getLocalIP: () => ipcRenderer.invoke('get-local-ip'),

    getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),

    manualSync: () => ipcRenderer.invoke('manual-sync'),

    onConnectionStatus: (callback) => {
        ipcRenderer.on('connection-status', (event, isOnline) => {
            callback(isOnline);
        });
    },

    onSyncStarted: (callback) => {
        ipcRenderer.on('sync-started', () => callback());
    },

    onSyncComplete: (callback) => {
        ipcRenderer.on('sync-complete', (event, result) => {
            callback(result);
        });
    },

    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('connection-status');
        ipcRenderer.removeAllListeners('sync-started');
        ipcRenderer.removeAllListeners('sync-complete');
    },

    platform: process.platform,
    isElectron: true
});