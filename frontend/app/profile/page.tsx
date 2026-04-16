"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page redirects to /profile/[username] instantly by reading the JWT
const ProfilePage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Decode username from JWT payload (base64) — no API call needed
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.username) {
        router.replace(`/profile/${payload.username}`);
      } else if (payload.id) {
        // Fallback: if JWT doesn't have username, use user ID
        router.replace(`/profile/${payload.id}`);
      } else {
        router.replace("/home");
      }
    } catch {
      router.replace("/home");
    }
  }, [router]);

  return null;
};

export default ProfilePage;
