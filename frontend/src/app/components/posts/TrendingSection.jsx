"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { feedService } from "../../lib/engagement";
import { Spinner } from "../ui";

function TrendingStoryRow({ number, label, postCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full flex items-center gap-4 rounded-xl border px-4 py-4 text-left
        border-gray-200 dark:border-gray-700
        transition-all duration-150
        hover:border-gray-400 dark:hover:border-gray-500
        hover:bg-gray-50 dark:hover:bg-white/5
        hover:shadow-sm
        active:scale-[0.99]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        dark:focus-visible:ring-offset-gray-900
      "
    >
      <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white shrink-0 w-8 sm:w-10 tabular-nums">
        {number}
      </span>
      <span
        className="h-8 sm:h-10 w-px bg-gray-200 dark:bg-gray-700 shrink-0"
        aria-hidden="true"
      />
      <span className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {label}
        </span>
        <span className="shrink-0 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {postCount} {postCount === 1 ? "post" : "posts"}
        </span>
      </span>
    </button>
  );
}

export function TrendingSection() {
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setTopicsLoading(true);
        setError("");

        const response = await feedService.getTrendingTopics({
          limit: 6,
          previewPostsPerTopic: 2,
        });

        setTopics(response?.topics || []);
      } catch (err) {
        console.error("Failed to load trending topics:", err);
        setError(err?.message || "Failed to load trending topics");
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  // Always route through the dashboard's topic view, which fetches via
  // getTrendingPostsByTopic — the exact same query used to compute each
  // topic's postCount above. Reusing the plain category page here would
  // apply a different, stricter filter (e.g. the trending feed's minimum
  // score threshold) and could show fewer posts than we just promised.
  const handleTopicClick = (topic) => {
    if (!topic) return;

    router.push(
      `/dashboard?topic=${encodeURIComponent(topic.topicKey)}&topicLabel=${encodeURIComponent(topic.label)}`,
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
    <div className="pl-3 sm:pl-5">
      <div className="relative mb-8">
        <div
          className="pointer-events-none absolute -top-10 -right-6 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-20 blur-3xl dark:opacity-25"
          aria-hidden="true"
        />
        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 dark:text-white">
          What&apos;s trending
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            today?
          </span>
        </h2>
        <p className="mt-2 text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400">
          Top stories right now
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <TrendingStoryRow
            key={topic.topicKey}
            number={String(index + 1).padStart(2, "0")}
            label={topic.label}
            postCount={topic.postCount}
            onClick={() => handleTopicClick(topic)}
          />
        ))}
      </div>
    </div>
  );
}
