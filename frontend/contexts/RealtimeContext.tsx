"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    // Only initialize if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    const token = storage.getAccessToken();
    if (!token) {
      return;
    }

    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      const username = payload.username;

      // Initialize presence tracking
      const initPresence = async () => {
        try {
          await initializePresence(userId, username, (presences) => {
            setPresenceMap(presences);
          });
          setIsConnected(true);
          console.log('🟢 Realtime system connected');
        } catch (error) {
          console.error('Failed to initialize presence:', error);
          setIsConnected(false);
        }
      };

      initPresence();

      // Cleanup on unmount
      return () => {
        const cleanup = async () => {
          await cleanupRealtimeChannels();
          setIsConnected(false);
          console.log('🔴 Realtime system disconnected');
        };
        cleanup();
      };
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  return (
    <RealtimeContext.Provider value={{ presenceMap, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};
