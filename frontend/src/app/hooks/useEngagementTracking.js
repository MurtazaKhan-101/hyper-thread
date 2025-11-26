"use client";

import { useEffect, useRef } from "react";
import { engagementService } from "../lib/engagement";

/**
 * Hook to track post view duration
 * @param {string} postId - The post ID to track
 * @param {boolean} isViewing - Whether the post is currently being viewed
 */
export const usePostViewTracking = (postId, isViewing = true) => {
  const viewStartTime = useRef(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!postId || !isViewing) return;

    // Start tracking when component mounts
    viewStartTime.current = Date.now();
    hasTracked.current = false;

    // Track view on unmount
    return () => {
      if (viewStartTime.current && !hasTracked.current) {
        const duration = Math.floor(
          (Date.now() - viewStartTime.current) / 1000
        );

        // Only track if user spent at least 3 seconds
        if (duration >= 3) {
          engagementService.trackView(postId, duration);
          hasTracked.current = true;
        }
      }
    };
  }, [postId, isViewing]);
};

/**
 * Hook to track search queries
 */
export const useSearchTracking = () => {
  const lastTrackedQuery = useRef("");

  const trackSearch = (query) => {
    if (
      query &&
      query !== lastTrackedQuery.current &&
      query.trim().length >= 2
    ) {
      engagementService.trackSearch(query);
      lastTrackedQuery.current = query;
    }
  };

  return { trackSearch };
};

/**
 * Track engagement when user likes a post
 */
export const trackLikeEngagement = async (postId) => {
  try {
    await engagementService.trackLike(postId);
  } catch (error) {
    console.error("Failed to track like:", error);
  }
};

/**
 * Track engagement when user comments on a post
 */
export const trackCommentEngagement = async (postId) => {
  try {
    await engagementService.trackComment(postId);
  } catch (error) {
    console.error("Failed to track comment:", error);
  }
};
