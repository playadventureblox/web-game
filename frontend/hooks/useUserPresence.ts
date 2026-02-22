import { useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

export interface UserPresence {
  presenceStatus: 'online' | 'offline' | 'in-game';
  currentGame?: string;
  lastOnline: string | null;
  isOnline: boolean;
}

/**
 * Hook to get real-time presence for a specific user.
 * Always returns a value — offline if user is not in the presence map.
 */
export const useUserPresence = (userId: string | undefined): UserPresence => {
  const { presenceMap } = useRealtime();

  return useMemo(() => {
    if (!userId) {
      return { presenceStatus: 'offline', lastOnline: null, isOnline: false };
    }
    const p = presenceMap.get(userId);
    if (p) {
      return {
        presenceStatus: p.presenceStatus,
        currentGame: p.currentGame,
        lastOnline: p.lastOnline,
        isOnline: p.presenceStatus === 'online' || p.presenceStatus === 'in-game',
      };
    }
    return { presenceStatus: 'offline', lastOnline: null, isOnline: false };
  }, [userId, presenceMap]);
};
