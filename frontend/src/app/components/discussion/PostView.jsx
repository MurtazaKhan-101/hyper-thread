"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService, formatPostTime, formatNumber } from "../../lib/posts";
import { ImageSlider } from "../posts/ImageSlider";
import Link from "next/link";
import { Newspaper } from "lucide-react";

export const PostView = ({ post, onUpdate, isDiscussionView = false }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(
    post.likedBy?.includes(user?._id) || false
  );
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [showFullContent, setShowFullContent] = useState(false);

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

  const renderContentWithReadMore = (content, className = "") => {
    if (!content) return null;

    const MAX_LENGTH = 500; // Characters to show before "Read More" (longer for detailed view)
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
            "mt-4 text-gray-800 dark:text-gray-200 text-lg leading-relaxed"
          )
        );

      case "link":
        return (
          <div className="mt-4 min-w-0 overflow-hidden">
            {post.linkThumbnail && (
              <div className="mb-4 overflow-hidden">
                <img
                  src={post.linkThumbnail}
                  alt="Link preview"
                  className="w-full max-w-full h-48 object-cover rounded-lg"
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
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-lg break-words">
                    {post.linkTitle || "Link"}
                  </h4>
                  {post.linkDescription && (
                    <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed break-words">
                      {post.linkDescription}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-3 break-all">
                    {new URL(post.linkUrl).hostname}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
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
                "mt-4 text-gray-800 dark:text-gray-200 text-lg leading-relaxed"
              )}
          </div>
        );

      case "media":
        return (
          <div className="mt-4 min-w-0 overflow-hidden">
            {post.content &&
              renderContentWithReadMore(
                post.content,
                "mb-4 text-gray-800 dark:text-gray-200 text-lg leading-relaxed"
              )}
            {post.media && post.media.length > 0 && (
              <div className="max-w-full overflow-hidden">
                <ImageSlider media={post.media} />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

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

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden max-w-full min-w-0 container-no-overflow">
      <div className="p-6 min-w-0">
        {/* Post Header */}
        <div className="flex items-start gap-3 mb-4 min-w-0">
          <div className="flex-shrink-0">
            {post.author?.profileImage ? (
              <img
                src={post.author.profileImage}
                alt={post.author.username}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {post.author?.firstName?.[0] || "U"}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                href={`/profile/${post.author?.username}`}
                className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 truncate"
              >
                u/{post.author?.username || "unknown"}
              </Link>
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
              <span className="text-gray-500 text-sm">•</span>
              <span className="text-gray-500 text-sm">
                {formatPostTime(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Post Title */}
        {post.title && (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 break-words">
            {post.title}
          </h1>
        )}

        {/* Post Category */}
        {post.category && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 capitalize">
              <Newspaper className="w-4 h-4 mr-1" />
              {post.category}
            </span>
          </div>
        )}

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
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

        {/* Post Actions */}
        <div className="flex items-center gap-3 md:gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-wrap min-w-0">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm transition-colors ${
              isLiked
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
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
            <span className="hidden sm:inline">
              {formatNumber(likeCount)} {likeCount === 1 ? "Like" : "Likes"}
            </span>
            <span className="sm:hidden">{formatNumber(likeCount)}</span>
          </button>

          <div className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-gray-600 dark:text-gray-400">
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
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
            <span className="hidden sm:inline">
              {formatNumber(getTotalCommentCount(post.comments))}{" "}
              {getTotalCommentCount(post.comments) === 1
                ? "Comment"
                : "Comments"}
            </span>
            <span className="sm:hidden">
              {formatNumber(getTotalCommentCount(post.comments))}
            </span>
          </div>

          <button className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
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
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
