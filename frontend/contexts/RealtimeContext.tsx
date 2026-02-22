"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { initializePresence, disconnectPresence, cleanupRealtimeChannels, PresenceData } from '@/lib/realtime';
import { isAuthenticated } from '@/lib/auth';
import { storage } from '@/lib/api';

interface RealtimeContextType {
  presenceMap: Map<string, PresenceData>;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({
  presenceMap: new Map(),
  isConnected: false,
});

export const useRealtime = () => useContext(RealtimeContext);

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const handlePresenceUpdate = useCallback((presences: Map<string, PresenceData>) => {
    // Replace the whole map — Supabase 'sync' gives us the full current state
    setPresenceMap(new Map(presences));
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const token = storage.getAccessToken();
    if (!token) return;

    let userId: string;
    let username: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
      username = payload.username;
    } catch {
      return;
    }

    const initPresence = async () => {
      try {
        await initializePresence(userId, username, handlePresenceUpdate);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to initialize presence:', error);
        setIsConnected(false);
      }
    };

    initPresence();

    // Mark offline when tab is hidden / closed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        disconnectPresence();
      } else if (document.visibilityState === 'visible') {
        // Re-join when tab becomes visible again
        initPresence();
      }
    };

    const handleBeforeUnload = () => {
      disconnectPresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupRealtimeChannels();
      setIsConnected(false);
    };
  }, [handlePresenceUpdate]);

  return (
    <RealtimeContext.Provider value={{ presenceMap, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};
