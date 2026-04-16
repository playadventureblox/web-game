import { storage, usersApi } from "./api";

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const accessToken = storage.getAccessToken();
  return !!accessToken;
};

/**
 * Get current user from API (not localStorage)
 * This fetches fresh data from the backend every time
 */
export const getCurrentUser = async () => {
  try {
    const response = await usersApi.getCurrentUser();

    if (response.success && response.data) {
      return response.data.user;
    }

    // Don't clear tokens here - apiCall already handles 401 with silent refresh
    // Only return null, let the caller decide what to do
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    // Don't clear tokens on network errors - could be a temporary issue
    return null;
  }
};

/**
 * Logout user and clear all auth data
 */
export const logout = async () => {
  try {
    const token = storage.getAccessToken();
    if (token) {
      // Call logout endpoint to invalidate token on server
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/logout`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always clear tokens locally
    storage.clearTokens();

    // Redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

/**
 * Redirect to login if not authenticated
 */
export const requireAuth = (): boolean => {
  if (typeof window !== "undefined" && !isAuthenticated()) {
    window.location.href = "/login";
    return false;
  }
  return true;
};

/**
 * Redirect to home if already authenticated
 */
export const redirectIfAuthenticated = (): boolean => {
  if (typeof window !== "undefined" && isAuthenticated()) {
    window.location.href = "/home";
    return true;
  }
  return false;
};

/**
 * Verify if token is still valid by making an API call
 */
export const verifyToken = async (): Promise<boolean> => {
  try {
    // First check if token exists at all
    const token = storage.getAccessToken();
    if (!token) return false;

    const user = await getCurrentUser();
    return !!user;
  } catch {
    // Don't clear tokens on catch - could be network issue
    return false;
  }
};

/**
 * Handle authentication after successful login/signup
 */
export const handleAuthSuccess = (
  accessToken: string,
  refreshToken: string,
) => {
  storage.setTokens(accessToken, refreshToken);
};

/**
 * Handle authentication errors
 */
export const handleAuthError = () => {
  storage.clearTokens();
};
