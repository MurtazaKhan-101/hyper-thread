"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService, formatPostTime, formatNumber } from "../../lib/posts";
import { useRouter } from "next/navigation";
import { ImageSlider } from "./ImageSlider";

export const PostCard = ({ post, onUpdate }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(
    post.likedBy?.includes(user?._id) || false
  );
  const [likeCount, setLikeCount] = useState(post.likes || 0);

  // Local comment state management
  const [comments, setComments] = useState(post.comments || []);

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
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const renderPostContent = () => {
    switch (post.postType) {
      case "text":
        return (
          post.content && (
            <div className="mt-3 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {post.content}
            </div>
          )
        );

      case "link":
        return (
          <div className="mt-3">
            {post.linkThumbnail && (
              <div className="mb-3 flex justify-center">
                <img
                  src={post.linkThumbnail}
                  alt="Link preview"
                  className="max-w-md h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {post.linkTitle || "Link"}
                  </h4>
                  {post.linkDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {post.linkDescription}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
            {post.content && (
              <div className="mt-3 text-gray-800 dark:text-gray-200">
                {post.content}
              </div>
            )}
          </div>
        );

      case "media":
        return (
          <div className="mt-3">
            {post.media && post.media.length > 0 && (
              <ImageSlider media={post.media} />
            )}
            {post.content && (
              <div className="mt-3 text-gray-800 dark:text-gray-200">
                {post.content}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="post-card-border relative p-0.5 rounded-lg transition-all duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-lg">
        <div onClick={handlePostClick} className="cursor-pointer block">
          {/* Post Header */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
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
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  u/{post.author?.username || "unknown"}
                </span>
                {post.author?.isVerified && (
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
                )}
              </div>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                {formatPostTime(post.createdAt)}
              </span>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
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
            {renderPostContent()}
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
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
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
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
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

            <button className="flex items-center gap-2 px-3 py-1 rounded-full text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
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
