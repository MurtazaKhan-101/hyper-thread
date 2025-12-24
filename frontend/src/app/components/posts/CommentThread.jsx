"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService, formatPostTime, formatNumber } from "../../lib/posts";
import { Button } from "../ui";
import { Pencil, Trash2, MoreHorizontal } from "lucide-react";

export const CommentThread = ({
  comment,
  postId,
  onUpdate,
  onDelete,
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

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  // Check if current user is the author of this comment
  const isAuthor = user?._id === comment.user?._id;

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update local state when comment prop changes
  useEffect(() => {
    setLocalComment(comment);
    setIsLiked(comment.likedBy?.includes(user?._id) || false);
    setLikeCount(comment.likes || 0);
    setEditText(comment.comment);
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
          ? [...(prev.likedBy || []), user.id]
          : (prev.likedBy || []).filter((id) => id !== user.id),
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

  // Handle reply deletion
  const handleReplyDelete = (replyId) => {
    setLocalComment((prev) => ({
      ...prev,
      replies: prev.replies?.filter((reply) => reply._id !== replyId) || [],
    }));
  };

  const handleEdit = async () => {
    if (!editText.trim() || editText === comment.comment) {
      setIsEditing(false);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await postService.editComment(
        postId,
        comment._id,
        editText.trim()
      );

      // Preserve the existing replies and other populated data
      const updatedComment = {
        ...localComment,
        comment: response.comment.comment,
        updatedAt: response.comment.updatedAt,
      };
      setLocalComment(updatedComment);
      setIsEditing(false);

      if (onUpdate) {
        onUpdate(updatedComment);
      }
    } catch (error) {
      console.error("Failed to edit comment:", error);
      setEditText(comment.comment); // Reset to original text
    }
    setIsSubmittingEdit(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.deleteComment(postId, comment._id);

      if (onDelete) {
        onDelete(comment._id);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.comment);
    setIsEditing(false);
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
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-black text-sm">
                      {localComment.user?.firstName ||
                        localComment.user?.username ||
                        "Unknown"}
                    </span>
                    <span className="text-xs text-gray-700">
                      {formatPostTime(localComment.createdAt)}
                      {localComment.updatedAt && (
                        <span className="ml-1 text-gray-300">(edited)</span>
                      )}
                    </span>
                  </div>

                  {/* Options menu for comment author */}
                  {isAuthor && isAuthenticated && (
                    <div className="relative" ref={optionsRef}>
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 text-black hover:text-gray-200 transition-colors"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowOptions(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-t-lg"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setShowOptions(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Content - Editable or Display */}
                {isEditing ? (
                  <div className="mb-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-700 rounded resize-none bg-gray-700 text-white"
                      rows={2}
                      maxLength={1000}
                      placeholder="Edit your message..."
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        type="button"
                        onClick={handleCancelEdit}
                        variant="outline_secondary"
                        className="text-xs px-3 py-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEdit}
                        disabled={!editText.trim() || isSubmittingEdit}
                        className="px-2 py-1 text-xs"
                      >
                        {isSubmittingEdit ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-black whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
                    {localComment.comment}
                  </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 backdrop-blur-sm bg-transparent flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        Delete Message
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Are you sure you want to delete this message? This
                        action cannot be undone.
                      </p>
                      <div className="flex gap-3 justify-end">
                        <Button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline_secondary"
                          className="text-xs px-3 py-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Actions */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleCommentLike}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                      isLiked
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        : "text-gray-700 hover:text-black hover:bg-gray-700"
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
                        className="w-full p-2 border border-gray-700 rounded text-sm resize-none bg-gray-800 text-white"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          onClick={() => setShowReplyForm(false)}
                          variant="outline_secondary"
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
                      onDelete={handleReplyDelete}
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-black">
                {localComment.user?.username || "unknown"}
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
              <span className="text-xs text-gray-700">
                {formatPostTime(localComment.createdAt)}
                {localComment.updatedAt && (
                  <span className="ml-1 text-gray-700">(edited)</span>
                )}
              </span>
            </div>

            {/* Options menu for comment author */}
            {isAuthor && isAuthenticated && (
              <div className="relative" ref={optionsRef}>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1 text-gray-300 hover:text-gray-200 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-6 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-t-lg"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowOptions(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-b-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment Content - Editable or Display */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 text-sm border border-gray-700 rounded resize-none bg-gray-800 text-white"
                rows={3}
                maxLength={1000}
                placeholder="Edit your comment..."
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleEdit}
                  disabled={!editText.trim() || isSubmittingEdit}
                  className="px-3 py-1 text-xs"
                >
                  {isSubmittingEdit ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-black mb-3 whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-word">
              {localComment.comment}
            </p>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-medium text-black mb-2">
                  Delete Comment
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this comment? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleCommentLike}
              disabled={!isAuthenticated}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-700 hover:text-black"
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
                className="text-xs text-gray-700 hover:text-black transition-colors"
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
                className="w-full p-2 text-sm border border-gray-700 rounded resize-none bg-gray-800 text-black"
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
                onDelete={handleReplyDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
    </div>
  );
};
