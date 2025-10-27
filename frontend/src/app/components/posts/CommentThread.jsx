"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService, formatPostTime, formatNumber } from "../../lib/posts";
import { Button } from "../ui";

export const CommentThread = ({
  comment,
  postId,
  onUpdate,
  depth = 0,
  isDiscussionView = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [localComment, setLocalComment] = useState(comment);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(depth === 0); // Only show replies for root comments by default
  const [newReply, setNewReply] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLiked, setIsLiked] = useState(
    comment.likedBy?.includes(user?._id) || false
  );
  const [likeCount, setLikeCount] = useState(comment.likes || 0);

  // Update local state when comment prop changes
  useEffect(() => {
    setLocalComment(comment);
    setIsLiked(comment.likedBy?.includes(user?._id) || false);
    setLikeCount(comment.likes || 0);
  }, [comment, user?._id]);

  const handleCommentLike = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await postService.toggleCommentLike(postId, comment._id);
      setIsLiked(response.liked);
      setLikeCount(response.likes);

      // Update local comment state to keep it in sync
      setLocalComment((prev) => ({
        ...prev,
        likes: response.likes,
        likedBy: response.liked
          ? [...(prev.likedBy || []), user._id]
          : (prev.likedBy || []).filter((id) => id !== user._id),
      }));
    } catch (error) {
      console.error("Failed to toggle comment like:", error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !isAuthenticated) return;

    setIsSubmittingReply(true);
    try {
      const response = await postService.addReply(
        postId,
        comment._id,
        newReply.trim()
      );

      // Update local comment with new reply immediately
      const updatedComment = {
        ...localComment,
        replies: [...(localComment.replies || []), response.reply],
      };
      setLocalComment(updatedComment);

      setNewReply("");
      setShowReplyForm(false);

      // Notify parent of the updated comment (for comment count updates)
      if (onUpdate) {
        onUpdate(updatedComment);
      }
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
    setIsSubmittingReply(false);
  };

  // Handle updates from nested replies without triggering parent refresh
  const handleReplyUpdate = (replyId, updatedReply) => {
    setLocalComment((prev) => ({
      ...prev,
      replies:
        prev.replies?.map((reply) =>
          reply._id === replyId ? updatedReply : reply
        ) || [],
    }));
  };

  const maxDepth = isDiscussionView ? 6 : 6; // Limit depth for discussion view to match backend capability

  // For discussion view, use dynamic margin-left with scroll for deeper levels
  const getDiscussionIndent = (depth) => {
    if (!isDiscussionView || depth === 0) return {};

    // Mobile-specific indentation (smaller increments)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      // On mobile, use very small indentation and strict max to prevent zoom-out
      const mobileIndent = depth * 8; // 8px per level on mobile
      return { marginLeft: `${Math.min(mobileIndent, 24)}px` }; // Max 24px on mobile
    }

    // Desktop logic (original)
    if (depth >= 4) {
      return { marginLeft: "64px" }; // Fixed max indent for deeper levels (4-6)
    }
    const desktopIndent = depth * 16; // 16px per level
    return { marginLeft: `${desktopIndent}px` };
  };

  const indentClass =
    depth > 0 && !isDiscussionView ? `ml-${Math.min(depth * 4, 20)}` : "";

  // Discussion view layout (chat-like) with overflow protection
  if (isDiscussionView) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    return (
      <div className="w-full min-w-0">
        <div
          style={getDiscussionIndent(depth)}
          className={`min-w-0 ${
            depth > 0 ? "border-l-2 border-blue-800 pl-3" : ""
          }`}
        >
          <div className="group hover:bg-gray-600/50 rounded-lg p-3 transition-colors min-w-0">
            <div className="flex gap-3 min-w-0">
              <div className="flex-shrink-0">
                {localComment.user?.profileImage ? (
                  <img
                    src={localComment.user.profileImage}
                    alt={localComment.user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {localComment.user?.firstName?.[0] || "U"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Message Header */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-gray-100 text-sm">
                    {localComment.user?.firstName ||
                      localComment.user?.username ||
                      "Unknown"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatPostTime(localComment.createdAt)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="text-sm text-gray-200 whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                  {localComment.comment}
                </div>

                {/* Message Actions */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleCommentLike}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      isLiked
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      className="w-3 h-3"
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
                    {likeCount > 0 && formatNumber(likeCount)}
                  </button>

                  {depth < maxDepth && (
                    <button
                      onClick={() => setShowReplyForm(!showReplyForm)}
                      className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-900/20 transition-colors font-medium"
                    >
                      Reply
                    </button>
                  )}

                  {/* Hide/Show Replies Button for Discussion View */}
                  {localComment.replies && localComment.replies.length > 0 && (
                    <button
                      onClick={() => setShowReplies(!showReplies)}
                      className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-900/20 transition-colors font-medium"
                    >
                      {showReplies ? "Hide" : "Show"}{" "}
                      {localComment.replies.length}{" "}
                      {localComment.replies.length === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                  <div className="mt-3 pl-2 border-l-2 border-blue-800">
                    <form onSubmit={handleReply} className="space-y-2">
                      <textarea
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Reply..."
                        className="w-full p-2 border border-gray-700 rounded text-sm resize-none bg-gray-800 text-gray-100"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowReplyForm(false)}
                          variant="outline"
                          className="text-xs px-3 py-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newReply.trim() || isSubmittingReply}
                          className="text-xs px-3 py-1"
                        >
                          {isSubmittingReply ? "Sending..." : "Reply"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Replies */}
            {showReplies &&
              localComment.replies &&
              localComment.replies.length > 0 && (
                <div className="mt-3 space-y-2">
                  {localComment.replies.map((reply) => (
                    <CommentThread
                      key={reply._id}
                      comment={reply}
                      postId={postId}
                      onUpdate={(updatedReply) => {
                        const updatedComment = {
                          ...localComment,
                          replies: localComment.replies.map((r) =>
                            r._id === reply._id ? updatedReply : r
                          ),
                        };
                        setLocalComment(updatedComment);

                        if (onUpdate) {
                          onUpdate(updatedComment);
                        }
                      }}
                      depth={depth + 1}
                      isDiscussionView={true}
                    />
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  // Standard post view layout
  return (
    <div
      className={`${indentClass} ${
        depth > 0 ? "border-l-2 border-gray-700 pl-4" : ""
      }`}
    >
      {/* Comment */}
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0">
          {localComment.user?.profileImage ? (
            <img
              src={localComment.user.profileImage}
              alt={localComment.user.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-300">
                {localComment.user?.firstName?.[0] || "U"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* Comment Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-100">
              u/{localComment.user?.username || "unknown"}
            </span>
            {localComment.user?.isVerified && (
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
            <span className="text-xs text-gray-400">
              {formatPostTime(localComment.createdAt)}
            </span>
          </div>

          {/* Comment Content */}
          <p className="text-sm text-gray-800 dark:text-gray-200 mb-3 whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
            {localComment.comment}
          </p>

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleCommentLike}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-400 hover:text-gray-300"
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

            {isAuthenticated && depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                Reply
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showReplies ? "Hide" : "Show"} {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && isAuthenticated && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 text-sm border border-gray-700 rounded resize-none bg-gray-800 text-gray-100"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setNewReply("");
                  }}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={!newReply.trim() || isSubmittingReply}
                  className="px-3 py-1 text-xs"
                >
                  {isSubmittingReply ? "Posting..." : "Reply"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies &&
        localComment.replies &&
        localComment.replies.length > 0 && (
          <div className="space-y-4">
            {localComment.replies.map((reply) => (
              <CommentThread
                key={reply._id}
                comment={reply}
                postId={postId}
                onUpdate={(updatedReply) => {
                  // Update this specific reply in local state
                  const updatedComment = {
                    ...localComment,
                    replies: localComment.replies.map((r) =>
                      r._id === reply._id ? updatedReply : r
                    ),
                  };
                  setLocalComment(updatedComment);

                  // Propagate the updated parent comment up the chain
                  if (onUpdate) {
                    onUpdate(updatedComment);
                  }
                }}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
    </div>
  );
};
