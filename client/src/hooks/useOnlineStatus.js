import { useState, useEffect } from 'react';

const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [syncResult, setSyncResult] = useState(null);

    useEffect(() => {
        // ============================================
        // ELECTRON ENVIRONMENT
        // Use Electron's IPC events for accuracy
        // ============================================
        if (window.electronAPI) {

            // Get initial status
            window.electronAPI.getOnlineStatus().then(status => {
                setIsOnline(status);
            });

            // Listen for connection changes every 30 seconds
            window.electronAPI.onConnectionStatus((status) => {
                setIsOnline(status);
            });

            // Listen for sync starting
            window.electronAPI.onSyncStarted(() => {
                setIsSyncing(true);
                setSyncResult(null);
            });

            // Listen for sync completing
            window.electronAPI.onSyncComplete((result) => {
                setIsSyncing(false);
                setLastSync(new Date());
                setSyncResult(result);
            });

            // Cleanup listeners when component unmounts
            return () => {
                window.electronAPI.removeAllListeners();
            };

        } else {
            // ============================================
            // BROWSER ENVIRONMENT
            // Fall back to browser's navigator.onLine
            // ============================================
            setIsOnline(navigator.onLine);

            const handleOnline = () => setIsOnline(true);
            const handleOffline = () => setIsOnline(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, []);

    // Manual sync trigger
    const triggerManualSync = async () => {
        if (!window.electronAPI) return;
        if (!isOnline) return;

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const result = await window.electronAPI.manualSync();
            setLastSync(new Date());
            setSyncResult(result);
        } catch (error) {
            console.error('Manual sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        isOnline,
        isSyncing,
        lastSync,
        syncResult,
        triggerManualSync
    };
};

export default useOnlineStatus;