import useOnlineStatus from '../../hooks/useOnlineStatus';

const OnlineBadge = () => {
    const { isOnline, isSyncing, lastSync, syncResult, triggerManualSync } = useOnlineStatus();

    const formatTime = (date) => {
        if (!date) return null;
        return date.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex items-center gap-2">

            {/* STATUS BADGE */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSyncing
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : isOnline
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
            }`}>

                {/* INDICATOR DOT */}
                {isSyncing ? (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
                ) : (
                    <div className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                )}

                {/* STATUS TEXT */}
                <span>
                    {isSyncing
                        ? 'Syncing...'
                        : isOnline
                            ? 'Online'
                            : 'Offline'
                    }
                </span>
            </div>

            {/* MANUAL SYNC BUTTON — only show when online and not syncing */}
            {isOnline && !isSyncing && window.electronAPI && (
                <button
                    onClick={triggerManualSync}
                    title="Sync now"
                    className="p-1.5 rounded-lg hover:bg-purple-50 transition-colors text-purple-400 hover:text-purple-700"
                >
                    {/* SYNC ICON */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                </button>
            )}

            {/* LAST SYNC TIME */}
            {lastSync && !isSyncing && (
                <span className="text-[10px] text-purple-300 hidden sm:block">
                    Synced {formatTime(lastSync)}
                </span>
            )}

            {/* SYNC RESULT SUMMARY */}
            {syncResult && !isSyncing && syncResult.success && (
                <span className="text-[10px] text-green-500 hidden sm:block">
                    ✓ {syncResult.pushed} pushed
                </span>
            )}

        </div>
    );
};

export default OnlineBadge;