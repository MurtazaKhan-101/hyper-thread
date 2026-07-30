import apiClient from "./api";
import { API_ENDPOINTS } from "./constants";

// Admin service for managing trending keywords
export const trendingKeywordsService = {
  async list() {
    return await apiClient.get(API_ENDPOINTS.TRENDING_KEYWORDS);
  },

  async create(word, boost) {
    const payload = { word };
    if (typeof boost === "number") payload.boost = boost;
    return await apiClient.post(API_ENDPOINTS.TRENDING_KEYWORDS, payload);
  },

  async update(id, updates) {
    return await apiClient.put(
      `${API_ENDPOINTS.TRENDING_KEYWORDS}/${id}`,
      updates,
    );
  },

  async remove(id) {
    return await apiClient.delete(`${API_ENDPOINTS.TRENDING_KEYWORDS}/${id}`);
  },
};
