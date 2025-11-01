"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as authService from "../lib/auth";
import { ROUTES } from "../lib/constants";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const { token, user } = authService.getAuthData();
      if (token && user) {
        setUser(user);
        setIsAuthenticated(true);

        // Check if token is expiring soon and refresh if needed
        if (authService.isTokenExpiringSoon(token)) {
          authService.refreshAccessToken().catch((error) => {
            console.error("Failed to refresh token on init:", error);
            logout();
          });
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check token every 4 minutes (240 seconds)
    const interval = setInterval(() => {
      const { token } = authService.getAuthData();
      if (token && authService.isTokenExpiringSoon(token)) {
        authService.refreshAccessToken().catch((error) => {
          console.error("Failed to refresh token:", error);
          logout();
        });
      }
    }, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  };

  // Register function
  const register = async (firstName, lastName, email, password) => {
    try {
      const response = await authService.register(
        firstName,
        lastName,
        email,
        password
      );
      return {
        success: response.success,
        message: response.message,
        user: response.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      const response = await authService.verifyOTP(email, otp);

      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return {
          success: true,
          message: response.message,
          user: response.user,
        };
      }

      return { success: false, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "OTP verification failed",
      };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      const response = await authService.resendOTP(email);
      return { success: response.success, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to resend OTP",
      };
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return { success: response.success, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to send reset OTP",
      };
    }
  };

  // Verify Reset OTP
  const verifyResetOTP = async (email, otp) => {
    try {
      const response = await authService.verifyResetOTP(email, otp);
      return { success: response.success, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Invalid or expired OTP",
      };
    }
  };

  // Reset Password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      return { success: response.success, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to reset password",
      };
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push(ROUTES.HOME);
  };

  // Refresh token
  const refresh = async () => {
    try {
      const response = await authService.refreshToken();
      return { success: response.success };
    } catch (error) {
      return { success: false };
    }
  };

  // Get current user from API
  const fetchCurrentUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      }
      return { success: false };
    } catch (error) {
      logout();
      return { success: false };
    }
  };

  // Update user data
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    authService.saveUserData(updatedUser);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    logout,
    refresh,
    fetchCurrentUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
