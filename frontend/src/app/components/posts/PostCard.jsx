"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService, formatPostTime, formatNumber } from "../../lib/posts";
import { trackLikeEngagement } from "../../hooks/useEngagementTracking";
import { useRouter } from "next/navigation";
import { ImageSlider } from "./ImageSlider";
import { MessageCircle, Flame } from "lucide-react";

export const PostCard = ({ post, onUpdate }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isLiked, setIsLiked] = useState(
    post.likedBy?.includes(user?._id) || false
  );
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showFullContent, setShowFullContent] = useState(false);

  // Local comment state management
  const [comments, setComments] = useState(post.comments || []);

  // Check if post is trending (score > 50, must be a valid number)
  const isTrending =
    typeof post.trendingScore === "number" && post.trendingScore > 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update comments when post prop changes
  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  // Helper function to count total comments including nested replies
  const getTotalCommentCount = (commentsList) => {
    let count = 0;
    const countComments = (comments) => {
      if (!comments) return 0;
      comments.forEach((comment) => {
        count++;
        if (comment.replies && comment.replies.length > 0) {
          countComments(comment.replies);
        }
      });
    };
    countComments(commentsList);
    return count;
  };

  const handlePostClick = () => {
    router.push(`/discussion/${post._id}`);
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await postService.toggleLike(post._id);
      setIsLiked(response.liked);
      setLikeCount(response.likes);

      // Track like engagement if liking (not unliking)
      if (response.liked) {
        await trackLikeEngagement(post._id);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const renderContentWithReadMore = (content, className = "") => {
    if (!content) return null;

    const MAX_LENGTH = 300; // Characters to show before "Read More"
    const shouldTruncate = content.length > MAX_LENGTH;
    const displayContent =
      shouldTruncate && !showFullContent
        ? content.substring(0, MAX_LENGTH) + "..."
        : content;

    return (
      <div
        className={`break-words break-all overflow-wrap-anywhere hyphens-auto ${className}`}
      >
        <span className="whitespace-pre-wrap">{displayContent}</span>
        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullContent(!showFullContent);
            }}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-medium flex-shrink-0"
          >
            {showFullContent ? "Show Less" : "Read More"}
          </button>
        )}
      </div>
    );
  };

  const renderPostContent = () => {
    switch (post.postType) {
      case "text":
        return (
          post.content &&
          renderContentWithReadMore(
            post.content,
            "mt-3 text-gray-800 dark:text-gray-200"
          )
        );

      case "link":
        return (
          <div className="mt-3 min-w-0 overflow-hidden">
            {post.linkThumbnail && (
              <div className="mb-3 flex justify-center overflow-hidden">
                <img
                  src={post.linkThumbnail}
                  alt="Link preview"
                  className="max-w-full w-full max-h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-0"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 break-words">
                    {post.linkTitle || "Link"}
                  </h4>
                  {post.linkDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                      {post.linkDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 break-all">
                    {new URL(post.linkUrl).hostname}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
            {post.content &&
              renderContentWithReadMore(
                post.content,
                "mt-3 text-gray-800 dark:text-gray-200"
              )}
          </div>
        );

      case "media":
        return (
          <div className="mt-3 min-w-0 overflow-hidden">
            {post.media && post.media.length > 0 && (
              <div className="max-w-full overflow-hidden">
                <ImageSlider media={post.media} />
              </div>
            )}
            {post.content &&
              renderContentWithReadMore(
                post.content,
                "mt-3 text-gray-800 dark:text-gray-200"
              )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="post-card-border relative p-0.5 rounded-lg transition-all duration-300 max-w-full min-w-0 container-no-overflow">
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden min-w-0">
        <div onClick={handlePostClick} className="cursor-pointer block min-w-0">
          {/* Post Header */}
          <div className="p-4 min-w-0">
            <div className="flex items-center gap-2 mb-3 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                {post.author?.profileImage ? (
                  <img
                    src={post.author.profileImage}
                    alt={post.author.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {post.author?.firstName?.[0] || "U"}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate min-w-0">
                  {post.author?.username || "unknown"}
                </span>
                {/* {post.author?.isVerified && (
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )} */}
              </div>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-[0.60rem] sm:text-sm text-gray-500">
                {formatPostTime(post.createdAt)}
              </span>
              {isTrending && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  {isMobile ? (
                    <span className="flex items-center gap-1 text-[0.60rem] sm:text-sm bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full text-orange-600 dark:text-orange-300">
                      <Flame className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[0.60rem] sm:text-sm bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full text-orange-600 dark:text-orange-300">
                      <Flame className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </>
              )}
              {post.category && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-[0.60rem] sm:text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-full text-blue-600 dark:text-blue-300 capitalize">
                    {post.category}
                  </span>
                </>
              )}
              {post.flair && (
                <>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                    {post.flair}
                  </span>
                </>
              )}
            </div>

            {/* Post Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 break-words">
              {post.title}
            </h3>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Content */}
            <div className="min-w-0 overflow-hidden">{renderPostContent()}</div>
          </div>
        </div>

        {/* Post Actions - Outside of Link */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLike();
              }}
              disabled={!isAuthenticated}
              className={`flex items-center gap-2 px-2 py-1 rounded-full text-sm transition-colors ${
                isLiked
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {formatNumber(likeCount)}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/discussion/${post._id}`);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {formatNumber(getTotalCommentCount(comments))}
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/chat/${post._id}`);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
              title="Join chat room"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>

            <button className="flex items-center gap-2 px-2 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
