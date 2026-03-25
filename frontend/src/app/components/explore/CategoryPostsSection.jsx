"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExplorePostCard } from "./ExplorePostCard";

export const CategoryPostsSection = ({
  categoryId,
  categoryLabel,
  posts = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const POSTS_PER_VIEW = 3;

  const totalPosts = posts.length;
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex + POSTS_PER_VIEW < totalPosts;

  const handleScrollLeft = () => {
    setCurrentIndex((prev) => Math.max(0, prev - POSTS_PER_VIEW));
  };

  const handleScrollRight = () => {
    setCurrentIndex((prev) =>
      Math.min(totalPosts - POSTS_PER_VIEW, prev + POSTS_PER_VIEW)
    );
  };

  const visiblePosts = posts.slice(currentIndex, currentIndex + POSTS_PER_VIEW);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
          {categoryLabel}
        </h2>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft
                ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight
                ? "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="flex flex-col">
        {visiblePosts.map((post) => (
          <ExplorePostCard key={post._id} post={post} />
        ))}
      </div>

      {/* Progress Indicator */}
      {totalPosts > POSTS_PER_VIEW && (
        <div className="flex justify-center mt-3 gap-2">
          {Array.from({
            length: Math.ceil(totalPosts / POSTS_PER_VIEW),
          }).map((_, idx) => {
            const isActive = Math.floor(currentIndex / POSTS_PER_VIEW) === idx;
            return (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all ${
                  isActive
                    ? "w-8 bg-blue-500"
                    : "w-2 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};