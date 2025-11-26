// API Base URL
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  VERIFY_OTP: "/auth/verify-otp",
  RESEND_OTP: "/auth/resend-otp",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_RESET_OTP: "/auth/verify-reset-otp",
  RESET_PASSWORD: "/auth/reset-password",
  REFRESH_TOKEN: "/auth/refresh-token",
  LOGOUT: "/auth/logout",
  GET_ME: "/auth/me",

  // Google OAuth endpoints
  GOOGLE_AUTH: "/auth/google",
  GOOGLE_CALLBACK: "/auth/google/callback",
  GOOGLE_REFRESH_TOKEN: "/auth/google/refresh-token",

  // Onboarding endpoints
  GENERATE_USERNAME: "/onboarding/generate-username",
  CHECK_USERNAME: "/onboarding/check-username",
  UPDATE_USERNAME: "/onboarding/username",
  UPDATE_INTERESTS: "/onboarding/interests",
  GET_INTERESTS: "/onboarding/interests",

  // Post endpoints
  CREATE_POST: "/posts",
  UPLOAD_MEDIA: "/posts/media/upload",
  CREATE_MEDIA_POST: "/posts/media",
  GENERATE_LINK_PREVIEW: "/posts/link-preview",
  GET_POSTS: "/posts",
  GET_TRENDING_POSTS: "/posts/trending",
  SEARCH_POSTS: "/posts/search",
  GET_POST_BY_ID: "/posts",
  LIKE_POST: "/posts",
  ADD_COMMENT: "/posts",
  ADD_REPLY: "/posts",
  LIKE_COMMENT: "/posts",
  LIKE_REPLY: "/posts",
  EDIT_COMMENT: "/posts",
  DELETE_COMMENT: "/posts",
  UPDATE_POST: "/posts",
  DELETE_POST: "/posts",

  // Engagement endpoints
  TRACK_VIEW: "/engagement/view",
  TRACK_LIKE: "/engagement/like",
  TRACK_COMMENT: "/engagement/comment",
  TRACK_SEARCH: "/engagement/search",
  GET_ENGAGEMENT_STATS: "/engagement/stats",

  // Feed endpoints
  PERSONALIZED_FEED: "/feed/personalized",
  TRENDING_FEED: "/feed/trending",
  SIMILAR_POSTS: "/feed/similar",

  // User preferences endpoints
  NOTIFICATION_PREFERENCES: "/user/notification-preferences",

  // Chat endpoints
  GET_CHAT_ROOM: "/chat",
  // JOIN_CHAT_ROOM: "/chat", // Handled via Socket.IO only
  // LEAVE_CHAT_ROOM: "/chat", // Handled via Socket.IO only
  GET_CHAT_HISTORY: "/chat",
  GET_CHAT_PARTICIPANTS: "/chat",
  UPDATE_LAST_SEEN: "/chat",
  ADD_MESSAGE_REACTION: "/chat",
  UPLOAD_CHAT_IMAGE: "/chat",
  GET_ACTIVE_CHAT_ROOMS: "/chat",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: "user_data", // Only store user data, not tokens
};

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  VERIFY_OTP: "/auth/verify-otp",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_RESET_OTP: "/auth/verify-reset-otp",
  RESET_PASSWORD: "/auth/reset-password",
  OAUTH_SUCCESS: "/auth/oauth-success",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  CREATE_POST: "/create-post",
  CHAT: "/chat",
  HELP: "/help",
  ABOUT: "/about",
  RULES: "/rules",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};
