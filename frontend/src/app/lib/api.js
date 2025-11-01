import {
  API_BASE_URL,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  API_ENDPOINTS,
} from "./constants";

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Get token from localStorage
  getToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return null;
  }

  // Get refresh token from localStorage
  getRefreshToken() {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return null;
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenExpiringSoon(token) {
    if (!token) return true;

    try {
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
  }

  // Process failed queue after successful refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Refresh access token
  async refreshAccessToken() {
    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.REFRESH_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to refresh token");
      }

      // Save new tokens
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

      this.processQueue(null, data.token);
      return data.token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.processQueue(error, null);

      // Clear auth data and redirect to login
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Set default headers
  getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request handler with auto token refresh
  async request(endpoint, options = {}) {
    // Check if we need to refresh token before making the request
    if (options.includeAuth !== false) {
      const token = this.getToken();
      if (token && this.isTokenExpiringSoon(token)) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error("Pre-request token refresh failed:", error);
          // Don't throw here, let the request proceed and handle 401 if needed
        }
      }
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle 401 Unauthorized (token expired)
      if (response.status === 401 && options.includeAuth !== false) {
        try {
          // Try to refresh token
          const newToken = await this.refreshAccessToken();

          // Retry the original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };

          const retryResponse = await fetch(url, retryConfig);
          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw {
              status: retryResponse.status,
              message: retryData.message || ERROR_MESSAGES.GENERIC_ERROR,
              data: retryData,
            };
          }

          return retryData;
        } catch (refreshError) {
          console.error("Token refresh during request failed:", refreshError);
          throw {
            status: 401,
            message: "Session expired. Please login again.",
            data: null,
          };
        }
      }

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.message || ERROR_MESSAGES.GENERIC_ERROR,
          data: data,
        };
      }

      return data;
    } catch (error) {
      // Network error
      if (!error.status) {
        throw {
          status: 0,
          message: ERROR_MESSAGES.NETWORK_ERROR,
          data: null,
        };
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
