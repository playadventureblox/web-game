"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usersApi } from "@/lib/api";

// This page redirects to /profile/[username]
const ProfilePage = () => {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        let response = await usersApi.getCurrentUser();

        // If first attempt fails, retry once (token refresh race condition)
        if (!response.success || !response.data) {
          await new Promise(resolve => setTimeout(resolve, 500));
          response = await usersApi.getCurrentUser();
        }

        if (response.success && response.data) {
          const user: any = response.data.user;
          router.replace(`/profile/${user.username}`);
        } else {
          // Only redirect to login if there's no token at all
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          if (!token) {
            router.replace("/login");
          }
          // If token exists but API failed, stay on loading — don't redirect
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
          router.replace("/login");
        }
      }
    };
    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <p className="text-gray-900 dark:text-gray-100">Loading profile...</p>
    </div>
  );
};

export default ProfilePage;
