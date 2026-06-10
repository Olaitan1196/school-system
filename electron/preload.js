import { contextBridge, ipcRenderer } from 'electron';

// ============================================
// EXPOSE SAFE APIS TO THE REACT FRONTEND
// React accesses these via window.electronAPI
// ============================================
contextBridge.exposeInMainWorld('electronAPI', {

    // Check if internet is available right now
    getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),

    // Trigger a manual sync from the frontend
    manualSync: () => ipcRenderer.invoke('manual-sync'),

    // Listen for connection status changes
    // Electron sends this every 30 seconds
    onConnectionStatus: (callback) => {
        ipcRenderer.on('connection-status', (event, isOnline) => {
            callback(isOnline);
        });
    },

    // Listen for when sync starts
    onSyncStarted: (callback) => {
        ipcRenderer.on('sync-started', () => callback());
    },

    // Listen for when sync finishes
    onSyncComplete: (callback) => {
        ipcRenderer.on('sync-complete', (event, result) => {
            callback(result);
        });
    },

    // Remove all listeners — called when component unmounts
    removeAllListeners: () => {
        ipcRenderer.removeAllListeners('connection-status');
        ipcRenderer.removeAllListeners('sync-started');
        ipcRenderer.removeAllListeners('sync-complete');
    },

    platform: process.platform,
    isElectron: true
});