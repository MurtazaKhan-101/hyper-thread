import apiClient from "./api";
import { API_ENDPOINTS, STORAGE_KEYS } from "./constants";

// Save auth data to localStorage
export const saveAuthData = (token, user, refreshToken = null) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }
};

// Get auth data from localStorage
export const getAuthData = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, refreshToken, user };
  }
  return { token: null, refreshToken: null, user: null };
};

// Get refresh token from localStorage
export const getRefreshToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return null;
};

// Check if token is about to expire (within 5 minutes)
export const isTokenExpiringSoon = (token) => {
  if (!token) return true;

  try {
    // Decode JWT token without verification
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = payload.exp;

    // Check if token expires within 5 minutes (300 seconds)
    return expiryTime - currentTime < 300;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await apiClient.post(
      API_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken },
      { includeAuth: false }
    );

    if (response.success) {
      const { token, refreshToken: newRefreshToken } = response;
      const { user } = getAuthData();

      // Save new tokens
      saveAuthData(token, user, newRefreshToken);

      return { token, refreshToken: newRefreshToken };
    } else {
      throw new Error("Failed to refresh token");
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear auth data on refresh failure
    clearAuthData();
    throw error;
  }
};

// Clear auth data from localStorage
export const clearAuthData = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

// Save user data to localStorage
export const saveUserData = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const { token } = getAuthData();
  return !!token;
};

// Register user
export const register = async (firstName, lastName, email, password) => {
  const response = await apiClient.post(
    API_ENDPOINTS.REGISTER,
    { firstName, lastName, email, password },
    { includeAuth: false }
  );
  return response;
};

// Login user
export const login = async (email, password) => {
  const response = await apiClient.post(
    API_ENDPOINTS.LOGIN,
    { email, password },
    { includeAuth: false }
  );

  if (response.success && response.token) {
    saveAuthData(response.token, response.user, response.refreshToken);
  }

  return response;
};

// Verify OTP
export const verifyOTP = async (email, otp) => {
  const response = await apiClient.post(
    API_ENDPOINTS.VERIFY_OTP,
    { email, otp },
    { includeAuth: false }
  );

  if (response.success && response.token) {
    saveAuthData(response.token, response.user, response.refreshToken);
  }

  return response;
};

// Resend OTP
export const resendOTP = async (email) => {
  const response = await apiClient.post(
    API_ENDPOINTS.RESEND_OTP,
    { email },
    { includeAuth: false }
  );
  return response;
};

// Forgot Password
export const forgotPassword = async (email) => {
  const response = await apiClient.post(
    API_ENDPOINTS.FORGOT_PASSWORD,
    { email },
    { includeAuth: false }
  );
  return response;
};

// Verify Reset OTP
export const verifyResetOTP = async (email, otp) => {
  const response = await apiClient.post(
    API_ENDPOINTS.VERIFY_RESET_OTP,
    { email, otp },
    { includeAuth: false }
  );
  return response;
};

// Reset Password
export const resetPassword = async (email, otp, newPassword) => {
  const response = await apiClient.post(
    API_ENDPOINTS.RESET_PASSWORD,
    { email, otp, newPassword },
    { includeAuth: false }
  );
  return response;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await apiClient.get(API_ENDPOINTS.GET_ME);
  return response;
};

// Refresh token
export const refreshToken = async () => {
  const response = await apiClient.post(API_ENDPOINTS.REFRESH_TOKEN);

  if (response.success && response.token) {
    const { user } = getAuthData();
    saveAuthData(response.token, user);
  }

  return response;
};

// Logout
export const logout = () => {
  clearAuthData();
};

// Refresh Google Token
export const refreshGoogleToken = async () => {
  const response = await apiClient.post(API_ENDPOINTS.GOOGLE_REFRESH_TOKEN);
  return response;
};
