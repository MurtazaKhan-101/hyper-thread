"use client";

import { useRouter } from "next/navigation";
import { formatPostTime } from "../../lib/posts";

export const ExplorePostCard = ({ post }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/discussion/${post._id}`);
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
      className="group cursor-pointer rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
    >
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
          <div className="flex items-center gap-2">
            {post.author?.profileImage ? (
              <img
                src={post.author.profileImage}
                alt={post.author.username}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">
                  {post.author?.firstName?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <span className="font-medium">
              {post.author?.firstName || post.author?.username || "Anonymous"}
            </span>
          </div>
          <span>{formatPostTime(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
