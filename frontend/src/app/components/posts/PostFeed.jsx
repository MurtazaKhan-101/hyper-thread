"use client";

import { useState, useEffect } from "react";
import { postService } from "../../lib/posts";
import { feedService } from "../../lib/engagement";
import { PostCard } from "./PostCard";
import { Spinner, Button } from "../ui";
import { Newspaper } from "lucide-react";

export const PostFeed = ({
  feedType = "latest",
  searchQuery = "",
  category = "",
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNext: false,
    totalPages: 0,
  });

  const fetchPosts = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      let response;
      const params = { page, limit: 10 };

      // Add category filter if specified
      if (category) {
        params.category = category;
      }

      switch (feedType) {
        case "personalized":
          response = await feedService.getPersonalizedFeed(params);
          break;
        case "trending":
          response = await feedService.getTrendingPosts(params);
          break;
        case "search":
          if (!searchQuery.trim()) {
            setPosts([]);
            return;
          }
          response = await postService.searchPosts(searchQuery, params);
          break;
        default:
          response = await postService.getPosts(params);
      }

      if (append) {
        setPosts((prev) => {
          // Deduplicate posts by _id
          const existingIds = new Set(prev.map((p) => p._id));
          const newPosts = response.posts.filter(
            (post) => !existingIds.has(post._id),
          );
          return [...prev, ...newPosts];
        });
      } else {
        // Deduplicate posts in initial load as well
        const seenIds = new Set();
        const uniquePosts = response.posts.filter((post) => {
          if (seenIds.has(post._id)) {
            return false;
          }
          seenIds.add(post._id);
          return true;
        });
        setPosts(uniquePosts);
      }

      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load posts");
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(1, false);
  }, [feedType, searchQuery, category]);

  const handleLoadMore = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchPosts(pagination.currentPage + 1, true);
    }
  };

  const handlePostUpdate = () => {
    // Refresh current page to show updated data
    fetchPosts(1, false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchPosts(1, false)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">
          <Newspaper className="mx-auto text-gray-300 dark:text-gray-600 w-12 h-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {searchQuery ? "No posts found" : "No posts yet"}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery
            ? `No posts match "${searchQuery}"`
            : "Be the first to create a post!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onUpdate={handlePostUpdate} />
      ))}

      {/* Load More Button */}
      {pagination.hasNext && (
        <div className="flex justify-center py-6">
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

      {/* End of Feed Message */}
      {!pagination.hasNext && posts.length > 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          You've reached the end of the feed
        </div>
      )}
    </div>
  );
};
