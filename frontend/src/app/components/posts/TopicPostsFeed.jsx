"use client";

import { useState, useEffect } from "react";
import { feedService } from "../../lib/engagement";
import { Button, Spinner } from "../ui";
import { PostCard } from "./PostCard";

// Renders the paginated post list for a single trending topic (by topicKey).
// Used when a trending row doesn't map to an existing category page (e.g.
// tag-based topics) — extracted so both the dashboard's topic view and any
// future topic surface can reuse the same fetch/pagination logic.
export function TopicPostsFeed({ topicKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNext: false,
    totalPages: 0,
  });
  const [error, setError] = useState("");

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await feedService.getTrendingPostsByTopic(topicKey, {
        page,
        limit: 10,
      });

      const newPosts = response?.posts || [];

      if (append) {
        setPosts((prevPosts) => {
          const existingIds = new Set(prevPosts.map((post) => post._id));
          const deduped = newPosts.filter((post) => !existingIds.has(post._id));
          return [...prevPosts, ...deduped];
        });
      } else {
        setPosts(newPosts);
      }

      setPagination(
        response?.pagination || {
          currentPage: 1,
          hasNext: false,
          totalPages: 0,
        },
      );
    } catch (err) {
      console.error("Failed to load topic posts:", err);
      setError(err?.message || "Failed to load posts");
      if (!append) {
        setPosts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!topicKey) return;
    fetchPosts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicKey]);

  const handleLoadMore = async () => {
    if (!pagination?.hasNext || loadingMore) return;
    await fetchPosts(pagination.currentPage + 1, true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No trending posts found for this topic.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onUpdate={() => {}} />
      ))}

      {pagination?.hasNext && (
        <div className="flex justify-center py-4">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={loadingMore}
            className="min-w-32"
          >
            <span className="flex items-center justify-center min-w-[80px]">
              {loadingMore ? <Spinner size="sm" /> : "Load More"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
