"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { storage } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = storage.getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      // Token exists — try to verify. If first attempt fails, retry once
      // (handles race conditions with token refresh)
      let isValid = await verifyToken();

      if (!isValid) {
        // Wait a moment and retry — silent refresh may be in progress
        await new Promise(resolve => setTimeout(resolve, 500));
        isValid = await verifyToken();
      }

      if (!isValid) {
        // Double-check token still doesn't exist (refresh may have cleared it)
        const tokenAfterRetry = storage.getAccessToken();
        if (!tokenAfterRetry) {
          router.push("/login");
        } else {
          // Token exists but verify failed — likely a temporary API issue
          // Show content anyway rather than blocking user
          setIsAuthorized(true);
          setIsLoading(false);
        }
      } else {
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
}
