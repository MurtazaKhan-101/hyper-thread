"use client";

import { useState, useEffect } from "react";
import { feedService } from "../../lib/engagement";
import { Button, Spinner } from "../ui";
import { PostCard } from "./PostCard";

// Two SVG shape variants for visual variety
const SHAPES = [
  {
    viewBox: "0 0 323 113",
    path: "M11.0594 4.61462L310.615 2.00043C317.056 1.94428 321.87 7.90326 320.46 14.1884L317.973 25.2799C317.489 27.4371 317.333 29.6548 317.51 31.8584L319.409 55.4609L318.226 100.219C318.112 104.526 314.607 107.97 310.298 108.007L10.6759 110.622C6.2578 110.661 2.64496 107.11 2.6064 102.692L2.45429 85.2611L4.04253 59.2199C4.10548 58.1873 4.09152 57.1512 4.00181 56.1206L2.00464 33.1771L3.1408 12.1821C3.36902 7.96489 6.83627 4.65151 11.0594 4.61462Z",
  },
  {
    viewBox: "0 0 323 116",
    path: "M10.8095 7.22982L310.331 2.00165C316.772 1.88929 321.637 7.80604 320.282 14.1033L317.892 25.216C317.427 27.3773 317.29 29.5963 317.486 31.7983L319.591 55.3833L318.798 100.15C318.722 104.458 315.247 107.932 310.939 108.007L11.351 113.237C6.93344 113.314 3.28976 109.795 3.21265 105.377L2.90842 87.9484L4.26935 61.8943C4.3233 60.8612 4.3003 59.8252 4.20159 58.7954L2.00428 35.8703L2.95719 14.8661C3.1486 10.6471 6.5868 7.30356 10.8095 7.22982Z",
  },
];

function TrendingTopicCard({ label, postCount, index, isActive, onClick }) {
  const shape = SHAPES[index % 2];

  return (
    <button
      onClick={onClick}
      className="relative w-full group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ aspectRatio: "323 / 116" }}
    >
      {/* SVG border shape */}
      <svg
        width="100%"
        height="100%"
        viewBox={shape.viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute inset-0 w-full h-full transition-all duration-200 ${
          isActive
            ? "drop-shadow-[0_0_8px_rgba(37,99,235,0.35)]"
            : "group-hover:drop-shadow-[0_0_6px_rgba(37,99,235,0.25)]"
        }`}
        preserveAspectRatio="none"
      >
        <path
          d={shape.path}
          stroke={isActive ? "#2563EB" : "#60A5FA"}
          strokeWidth="4"
        />
      </svg>

      {/* Topic label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
        <span className="text-black dark:text-white font-bold text-base sm:text-lg text-center leading-tight line-clamp-2">
          {label}
        </span>
        <span className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          {postCount} posts
        </span>
      </div>
    </button>
  );
}

export function TrendingSection() {
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNext: false,
    totalPages: 0,
  });
  const [error, setError] = useState("");

  const fetchTopicPosts = async (topicKey, page = 1, append = false) => {
    try {
      if (append) {
        setPostsLoadingMore(true);
      } else {
        setPostsLoading(true);
      }

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
      console.error("Failed to load trending posts by topic:", err);
      setError(err?.message || "Failed to load trending posts");
      if (!append) {
        setPosts([]);
      }
    } finally {
      setPostsLoading(false);
      setPostsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setTopicsLoading(true);
        setError("");

        const response = await feedService.getTrendingTopics({
          limit: 6,
          previewPostsPerTopic: 2,
        });

        const fetchedTopics = response?.topics || [];
        setTopics(fetchedTopics);

        if (fetchedTopics.length > 0) {
          setSelectedTopic(fetchedTopics[0]);
          await fetchTopicPosts(fetchedTopics[0].topicKey, 1, false);
        } else {
          setSelectedTopic(null);
          setPosts([]);
        }
      } catch (err) {
        console.error("Failed to load trending topics:", err);
        setError(err?.message || "Failed to load trending topics");
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  const handleTopicClick = async (topic) => {
    if (!topic || topic.topicKey === selectedTopic?.topicKey) {
      return;
    }

    setSelectedTopic(topic);
    setError("");
    await fetchTopicPosts(topic.topicKey, 1, false);
  };

  const handleLoadMore = async () => {
    if (!selectedTopic?.topicKey || !pagination?.hasNext || postsLoadingMore) {
      return;
    }

    await fetchTopicPosts(
      selectedTopic.topicKey,
      pagination.currentPage + 1,
      true,
    );
  };

  if (topicsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!topics.length && !error) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No trending topics right now.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Trending
      </h2>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {topics.map((topic, index) => (
          <TrendingTopicCard
            key={topic.topicKey}
            label={topic.label}
            postCount={topic.postCount}
            index={index}
            isActive={selectedTopic?.topicKey === topic.topicKey}
            onClick={() => handleTopicClick(topic)}
          />
        ))}
      </div>

      <div className="mt-8">
        {selectedTopic && (
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {selectedTopic.label} Posts
          </h3>
        )}

        {postsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No trending posts found for this topic.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} onUpdate={() => {}} />
            ))}

            {pagination?.hasNext && (
              <div className="flex justify-center py-4">
                <Button
                  onClick={handleLoadMore}
                  variant="outline"
                  disabled={postsLoadingMore}
                  className="min-w-32"
                >
                  <span className="flex items-center justify-center min-w-[80px]">
                    {postsLoadingMore ? <Spinner size="sm" /> : "Load More"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
