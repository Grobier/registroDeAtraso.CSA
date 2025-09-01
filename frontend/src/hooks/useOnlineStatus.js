import { useState, useEffect } from 'react';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Notificar que volvió la conexión
        console.log('🌐 Conexión restaurada');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('❌ Conexión perdida');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
};

export default useOnlineStatus;
