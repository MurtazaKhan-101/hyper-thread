"use client";

import { useState, useEffect } from "react";
import { feedService } from "../../lib/engagement";
import { Spinner } from "../ui";
import { useRouter } from "next/navigation";

const DUMMY_TOPICS = [
  { id: "1", label: "The Espstein Files" },
  { id: "2", label: "EU Reforms" },
  { id: "3", label: "TRUMP" },
  { id: "4", label: "Prince Williams State Visit" },
  { id: "5", label: "Paris Fashion Week" },
  { id: "6", label: "EU Reforms" },
];

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

function TrendingTopicCard({ label, postId, index }) {
  const router = useRouter();
  const shape = SHAPES[index % 2];

  const handleClick = () => {
    if (postId) {
      router.push(`/discussion/${postId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
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
        className="absolute inset-0 w-full h-full transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(188,113,206,0.5)]"
        preserveAspectRatio="none"
      >
        <path
          d={shape.path}
          stroke="#BC71CE"
          strokeWidth="4"
        />
      </svg>

      {/* Topic label */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <span className="text-black dark:text-white font-bold text-base sm:text-lg text-center leading-tight line-clamp-2">
          {label}
        </span>
      </div>
    </button>
  );
}

export function TrendingSection() {
  const [topics, setTopics] = useState(DUMMY_TOPICS);
  const [loading, setLoading] = useState(false);

  // TODO: replace dummy data with real API once confirmed design looks good
  // useEffect(() => {
  //   const fetchTrending = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await feedService.getTrendingPosts({ page: 1, limit: 6 });
  //       if (response?.posts?.length) {
  //         setTopics(
  //           response.posts.slice(0, 6).map((post) => ({
  //             id: post._id,
  //             label: post.title || post.content?.slice(0, 50) || "Trending",
  //           }))
  //         );
  //       }
  //     } catch (err) {
  //       console.error("Failed to load trending topics:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchTrending();
  // }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!topics.length) {
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
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {topics.map((topic, index) => (
          <TrendingTopicCard
            key={topic.id}
            label={topic.label}
            postId={topic.id}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
