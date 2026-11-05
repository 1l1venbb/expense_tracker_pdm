import { useEffect, useState } from 'react';

// Tracks the browser's online/offline status so the UI can react to it.
export function useNetworkStatus(): boolean {
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        const goOnline = () => setOnline(true);
        const goOffline = () => setOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return online;
}
