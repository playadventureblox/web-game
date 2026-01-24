"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSocket, disconnectSocket, onPresenceUpdate, offPresenceUpdate } from '@/lib/socket';
import { isAuthenticated } from '@/lib/auth';

interface PresenceData {
  userId: string;
  username: string;
  presenceStatus: string;
  currentGame?: string;
  lastOnline: string;
}

interface PresenceContextType {
  presenceMap: Map<string, PresenceData>;
  isConnected: boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  presenceMap: new Map(),
  isConnected: false,
});

export const usePresence = () => useContext(PresenceContext);

interface PresenceProviderProps {
  children: ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only initialize socket if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    const socket = initializeSocket();
    
    if (!socket) {
      return;
    }

    // Handle connection status
    const handleConnect = () => {
      setIsConnected(true);
      console.log('🟢 Presence system connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('🔴 Presence system disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial connection status
    if (socket.connected) {
      setIsConnected(true);
    }

    // Handle presence updates
    const handlePresenceUpdate = (data: PresenceData) => {
      setPresenceMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data);
        return newMap;
      });
    };

    onPresenceUpdate(handlePresenceUpdate);

    // Cleanup on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      offPresenceUpdate(handlePresenceUpdate);
      disconnectSocket();
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ presenceMap, isConnected }}>
      {children}
    </PresenceContext.Provider>
  );
};
