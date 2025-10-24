import apiClient from "./api";
import { API_ENDPOINTS } from "./constants";

// Post service for handling all post-related API calls
export const postService = {
  // Create a text or link post
  async createPost(postData) {
    try {
      return await apiClient.post(API_ENDPOINTS.CREATE_POST, postData);
    } catch (error) {
      throw error;
    }
  },

  // Upload media files
  async uploadMedia(files) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("media", file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003"}${
          API_ENDPOINTS.UPLOAD_MEDIA
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiClient.getToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // Create media post
  async createMediaPost(postData) {
    try {
      return await apiClient.post(API_ENDPOINTS.CREATE_MEDIA_POST, postData);
    } catch (error) {
      throw error;
    }
  },

  // Generate link preview
  async generateLinkPreview(url) {
    try {
      return await apiClient.post(API_ENDPOINTS.GENERATE_LINK_PREVIEW, { url });
    } catch (error) {
      throw error;
    }
  },

  // Get posts with filtering and pagination
  async getPosts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString
        ? `${API_ENDPOINTS.GET_POSTS}?${queryString}`
        : API_ENDPOINTS.GET_POSTS;
      return await apiClient.get(endpoint, { includeAuth: false });
    } catch (error) {
      throw error;
    }
  },

  // Get trending posts
  async getTrendingPosts(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString
        ? `${API_ENDPOINTS.GET_TRENDING_POSTS}?${queryString}`
        : API_ENDPOINTS.GET_TRENDING_POSTS;
      return await apiClient.get(endpoint, { includeAuth: false });
    } catch (error) {
      throw error;
    }
  },

  // Search posts
  async searchPosts(query, params = {}) {
    try {
      const searchParams = { q: query, ...params };
      const queryString = new URLSearchParams(searchParams).toString();
      return await apiClient.get(
        `${API_ENDPOINTS.SEARCH_POSTS}?${queryString}`,
        { includeAuth: false }
      );
    } catch (error) {
      throw error;
    }
  },

  // Get single post by ID
  async getPostById(postId) {
    try {
      return await apiClient.get(`${API_ENDPOINTS.GET_POST_BY_ID}/${postId}`, {
        includeAuth: false,
      });
    } catch (error) {
      throw error;
    }
  },

  // Like/unlike a post
  async toggleLike(postId) {
    try {
      return await apiClient.post(`${API_ENDPOINTS.LIKE_POST}/${postId}/like`);
    } catch (error) {
      throw error;
    }
  },

  // Add comment to post
  async addComment(postId, comment) {
    try {
      return await apiClient.post(
        `${API_ENDPOINTS.ADD_COMMENT}/${postId}/comment`,
        { comment }
      );
    } catch (error) {
      throw error;
    }
  },

  // Delete post
  async deletePost(postId) {
    try {
      return await apiClient.delete(`${API_ENDPOINTS.DELETE_POST}/${postId}`);
    } catch (error) {
      throw error;
    }
  },
};

// Helper functions
export const formatPostTime = (dateString) => {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - postDate) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return postDate.toLocaleDateString();
};

export const formatNumber = (num) => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1) + "k";
  return (num / 1000000).toFixed(1) + "M";
};
