"use client";

import { useRouter } from "next/navigation";
import { formatPostTime } from "../../lib/posts";
import { ExternalLink } from "lucide-react";

export const ExplorePostCard = ({ post }) => {
  const router = useRouter();

  const handleClick = () => {
    if (post.isExternal && post.linkUrl) {
      window.open(post.linkUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/discussion/${post._id}`);
    }
  };

  const getThumbnail = () => {
    if (post.postType === "media" && post.media?.length > 0) {
      return post.media[0].url;
    }
    if (post.postType === "link" && post.linkThumbnail) {
      return post.linkThumbnail;
    }
    return null;
  };

  const thumbnail = getThumbnail();

  const getSourceName = () => {
    if (post.source) return post.source;
    if (post.isExternal && post.linkUrl) {
      try {
        return new URL(post.linkUrl).hostname.replace("www.", "");
      } catch {
        return "External";
      }
    }
    return post.author?.username || post.author?.name || null;
  };

  const sourceName = getSourceName();

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer flex items-center gap-4 py-4 md:py-5 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 px-3 rounded-lg"
    >
      {/* Left: Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Source */}
        {sourceName && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-sm bg-red-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-black leading-none">
                {sourceName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {sourceName}
            </span>
            {post.isExternal && (
              <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
          </div>
        )}

        {/* Headline */}
        <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white line-clamp-3 leading-snug">
          {post.title || "Untitled Post"}
        </h3>

        {/* Time */}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatPostTime(post.createdAt)}
        </span>
      </div>

      {/* Right: Thumbnail */}
      <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-28 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sidebar-gradient">
            <span className="text-white text-2xl font-bold opacity-50">
              {post.title?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};