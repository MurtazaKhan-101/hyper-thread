import apiClient from "./api";

// Engagement tracking service
export const engagementService = {
  // Track post view with duration
  async trackView(postId, duration) {
    try {
      return await apiClient.post(`/engagement/view/${postId}`, { duration });
    } catch (error) {
      console.error("Error tracking view:", error);
      // Don't throw - tracking shouldn't break UI
    }
  },

  // Track post like
  async trackLike(postId) {
    try {
      return await apiClient.post(`/engagement/like/${postId}`);
    } catch (error) {
      console.error("Error tracking like:", error);
    }
  },

  // Track post comment
  async trackComment(postId) {
    try {
      return await apiClient.post(`/engagement/comment/${postId}`);
    } catch (error) {
      console.error("Error tracking comment:", error);
    }
  },

  // Track search query
  async trackSearch(query) {
    try {
      return await apiClient.post("/engagement/search", { query });
    } catch (error) {
      console.error("Error tracking search:", error);
    }
  },

  // Get user engagement stats
  async getStats() {
    try {
      return await apiClient.get("/engagement/stats");
    } catch (error) {
      console.error("Error getting engagement stats:", error);
      throw error;
    }
  },
};

// Feed service for personalized and trending feeds
export const feedService = {
  // Get personalized feed
  async getPersonalizedFeed(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
      });

      if (params.category) {
        queryParams.append("category", params.category);
      }

      return await apiClient.get(`/feed/personalized?${queryParams}`);
    } catch (error) {
      console.error("Error getting personalized feed:", error);
      throw error;
    }
  },

  // Get trending posts
  async getTrendingPosts(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
      });

      if (params.category) {
        queryParams.append("category", params.category);
      }

      return await apiClient.get(`/feed/trending?${queryParams}`);
    } catch (error) {
      console.error("Error getting trending posts:", error);
      throw error;
    }
  },

  // Get trending topic cards for topic-first layout
  async getTrendingTopics(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        limit: params.limit || 6,
        previewPostsPerTopic: params.previewPostsPerTopic || 2,
      });

      return await apiClient.get(`/feed/trending/topics?${queryParams}`);
    } catch (error) {
      console.error("Error getting trending topics:", error);
      throw error;
    }
  },

  // Get trending posts for one topic
  async getTrendingPostsByTopic(topicKey, params = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
      });

      return await apiClient.get(
        `/feed/trending/topic/${encodeURIComponent(topicKey)}?${queryParams}`,
      );
    } catch (error) {
      console.error("Error getting trending posts by topic:", error);
      throw error;
    }
  },

  // Get similar posts
  async getSimilarPosts(postId, limit = 5) {
    try {
      return await apiClient.get(`/feed/similar/${postId}?limit=${limit}`);
    } catch (error) {
      console.error("Error getting similar posts:", error);
      throw error;
    }
  },
};

// User preferences service
export const userPreferencesService = {
  // Get notification preferences
  async getNotificationPreferences() {
    try {
      return await apiClient.get("/user/notification-preferences");
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      throw error;
    }
  },

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      return await apiClient.put("/user/notification-preferences", preferences);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  },
};
