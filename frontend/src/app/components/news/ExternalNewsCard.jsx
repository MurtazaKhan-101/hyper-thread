"use client";

import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { formatPostTime } from "../../lib/posts";

const truncateText = (value, maxLength) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trimEnd() + "...";
};

export const ExternalNewsCard = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sourceName = useMemo(() => {
    if (post?.source) return post.source;
    if (post?.linkUrl) {
      try {
        return new URL(post.linkUrl).hostname.replace("www.", "");
      } catch {
        return "External";
      }
    }
    return "External";
  }, [post?.linkUrl, post?.source]);

  const thumbnail = post?.linkThumbnail || null;
  const headline = post?.title || "Untitled News Article";
  const description = post?.linkDescription || post?.content || "";

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-600 dark:text-gray-300 truncate">
                {sourceName}
              </span>
              <span className="text-gray-400">•</span>
              <span>{formatPostTime(post.createdAt)}</span>
            </div>
            <div className="mt-2 text-sm md:text-base font-semibold text-gray-900 dark:text-white">
              {truncateText(headline, 80)}
            </div>
          </div>
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={headline}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sidebar-gradient">
                <span className="text-white text-lg font-bold opacity-70">
                  {headline?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
            {headline}
          </div>

          {thumbnail && (
            <div className="mt-3 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                src={thumbnail}
                alt={headline}
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}

          {description && (
            <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}

          {post?.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{sourceName}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
