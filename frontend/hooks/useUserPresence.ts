import { useEffect, useState } from 'react';
import { usePresence } from '@/contexts/PresenceContext';

interface UserPresence {
  presenceStatus: string;
  currentGame?: string;
  lastOnline: string;
}

/**
 * Hook to get real-time presence for a specific user
 */
export const useUserPresence = (userId: string | undefined): UserPresence | null => {
  const { presenceMap } = usePresence();
  const [presence, setPresence] = useState<UserPresence | null>(null);

  useEffect(() => {
    if (!userId) {
      setPresence(null);
      return;
    }

    const userPresence = presenceMap.get(userId);
    if (userPresence) {
      setPresence({
        presenceStatus: userPresence.presenceStatus,
        currentGame: userPresence.currentGame,
        lastOnline: userPresence.lastOnline,
      });
    }
  }, [userId, presenceMap]);

  return presence;
};
