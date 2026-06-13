import { useState, useEffect } from 'react';

const NetworkInfoBar = () => {
    const [localIP, setLocalIP] = useState(null);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getLocalIP().then((ip) => {
                setLocalIP(ip);
            });
        }
    }, []);

    if (!localIP) return null;

    return (
        <div className="bg-purple-700 text-white px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
                <span>📡</span>
                <span className="font-medium">Local Network Address:</span>
                <span className="bg-white text-purple-700 font-bold px-3 py-0.5 rounded-full text-xs tracking-wide">
                    {localIP}
                </span>
            </div>
            <span className="text-purple-200 text-xs hidden sm:block">
                Students and teachers can access the app by typing this address in their browser
            </span>
        </div>
    );
};

export default NetworkInfoBar;