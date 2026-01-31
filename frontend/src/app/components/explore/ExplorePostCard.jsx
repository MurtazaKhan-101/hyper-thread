"use client";

import { useRouter } from "next/navigation";
import { formatPostTime } from "../../lib/posts";
import { ExternalLink } from "lucide-react";

export const ExplorePostCard = ({ post }) => {
  const router = useRouter();

  const handleClick = () => {
    // For external posts, open the link in a new tab
    if (post.isExternal && post.linkUrl) {
      window.open(post.linkUrl, "_blank", "noopener,noreferrer");
    } else {
      router.push(`/discussion/${post._id}`);
    }
  };

  // Get thumbnail image
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

  // Truncate title
  const truncateTitle = (title, maxLength = 60) => {
    if (!title) return "Untitled Post";
    return title.length > maxLength
      ? title.substring(0, maxLength) + "..."
      : title;
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative"
    >
      {/* External Source Badge */}
      {post.isExternal && (
        <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <ExternalLink className="w-3 h-3" />
          <span>External</span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video bg-sidebar-gradient overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sidebar-gradient">
            <span className="text-white text-4xl font-bold opacity-50">
              {post.title?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
          {truncateTitle(post.title)}
        </h3>

        {/* Author & Time */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{formatPostTime(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
