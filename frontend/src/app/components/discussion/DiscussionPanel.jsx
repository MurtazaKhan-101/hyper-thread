"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { postService } from "../../lib/posts";
import { Button } from "../ui";
import { CommentThread } from "../posts/CommentThread";
import { SendHorizontal } from "lucide-react";
import {
  usePostViewTracking,
  trackCommentEngagement,
} from "../../hooks/useEngagementTracking";

export const DiscussionPanel = ({
  post,
  comments,
  onCommentsUpdate,
  isMobile = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [localComments, setLocalComments] = useState(comments || []);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRefreshingComments, setIsRefreshingComments] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Track view duration for this post
  usePostViewTracking(post?._id, true);

  useEffect(() => {
    setLocalComments(comments || []);
  }, [comments]);

  useEffect(() => {
    scrollToBottom();
  }, [localComments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmittingComment(true);
    try {
      const response = await postService.addComment(
        post._id,
        newComment.trim()
      );
      setNewComment("");

      // Track comment engagement
      await trackCommentEngagement(post._id);

      // Add new comment to local state immediately
      const updatedComments = [...localComments, response.comment];
      setLocalComments(updatedComments);
      onCommentsUpdate(updatedComments);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = "44px"; // Reset to min height
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      setErrors({ submit: error.message || "Failed to add comment" });
    }
    setIsSubmittingComment(false);
  };

  // Function to update a specific comment in the local state
  const updateComment = (commentId, updatedComment) => {
    const updatedComments = localComments.map((comment) =>
      comment._id === commentId ? updatedComment : comment
    );
    setLocalComments(updatedComments);
    onCommentsUpdate(updatedComments);
  };

  // Function to delete a specific comment from the local state
  const deleteComment = (commentId) => {
    const updatedComments = localComments.filter(
      (comment) => comment._id !== commentId
    );
    setLocalComments(updatedComments);
    onCommentsUpdate(updatedComments);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment(e);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    // Prevent typing beyond 1000 characters
    if (value.length > 1000) {
      return;
    }

    setNewComment(value);
    adjustTextareaHeight(e);
  };

  const adjustTextareaHeight = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "44px"; // Reset to min height
    }
  };

  return (
    <div
      className={`flex flex-col ${
        isMobile ? "h-auto" : "h-full"
      } bg-chat-gradient`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <div>
            <h2 className="font-semibold text-black">Discussion</h2>
            <p className="text-sm text-gray-700">
              {getTotalCommentCount(localComments)}{" "}
              {getTotalCommentCount(localComments) === 1
                ? "message"
                : "messages"}
            </p>
          </div>
        </div>
      </div>

      {/* Comment Input - Move to top for mobile */}
      {isAuthenticated && isMobile && (
        <div className="px-6 py-4 border-b border-gray-800 bg-[#0f0f0f]">
          <form onSubmit={handleComment} className="space-y-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a comment..."
                maxLength={1000}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg resize-none text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 overflow-hidden"
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />

              {/* Character count indicator */}
              {newComment.length > 0 && (
                <div className="absolute bottom-5 right-2 text-xs text-gray-500">
                  {newComment.length}/1000
                </div>
              )}
            </div>

            {/* Character Limit Warning */}
            {newComment.length > 900 && (
              <div className="mt-2 text-right">
                <span
                  className={`text-xs font-medium ${
                    newComment.length >= 1000
                      ? "text-red-500"
                      : newComment.length > 950
                      ? "text-orange-500"
                      : "text-yellow-500"
                  }`}
                >
                  {newComment.length >= 1000
                    ? "Character limit reached"
                    : `${1000 - newComment.length} characters remaining`}
                </span>
              </div>
            )}

            <div className="flex justify-end items-center">
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? "Sending..." : "Send"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Area */}
      <div
        className={`flex-1 ${
          isMobile
            ? "overflow-y-auto scrollbar-hide"
            : "overflow-y-auto scrollbar-hide"
        } px-6 py-4 space-y-4`}
      >
        {isRefreshingComments && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {localComments.length === 0 && !isRefreshingComments ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
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
            </div>
            <h3 className="text-lg font-medium text-black mb-2">
              Start the conversation
            </h3>
            <p className="text-gray-600">
              Be the first to share your thoughts on this post
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {localComments.map((comment) => (
              <div key={comment._id} className="group">
                <CommentThread
                  comment={comment}
                  postId={post._id}
                  onUpdate={(updatedComment) =>
                    updateComment(comment._id, updatedComment)
                  }
                  onDelete={deleteComment}
                  depth={0}
                  isDiscussionView={true}
                />
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Comment Input - Bottom for desktop only */}
      {isAuthenticated && !isMobile && (
        <div className="px-6 py-4 border border-gray-800 bg-[#0f0f0f]">
          <form onSubmit={handleComment} className="space-y-3">
            <div className="flex gap-3 mt-4">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  maxLength={1000}
                  className="w-full scrollbar-hide p-3 border border-gray-700 rounded-lg resize-none bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                />

                {/* Character count indicator */}
                {newComment.length > 0 && (
                  <div className="absolute bottom-5 right-2 text-xs text-gray-500">
                    {newComment.length}/1000
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="mb-4 px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {isSubmittingComment ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SendHorizontal className="w-4 h-4 text-black" />
                )}
              </Button>
            </div>

            {/* Character Limit Warning for Desktop */}
            {newComment.length > 900 && (
              <div className="text-right">
                <span
                  className={`text-xs font-medium ${
                    newComment.length >= 1000
                      ? "text-red-500"
                      : newComment.length > 950
                      ? "text-orange-500"
                      : "text-yellow-500"
                  }`}
                >
                  {newComment.length >= 1000
                    ? "Character limit reached"
                    : `${1000 - newComment.length} characters remaining`}
                </span>
              </div>
            )}
          </form>
        </div>
      )}

      {!isAuthenticated && (
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0f0f0f] text-center">
          <p className="text-gray-600 mb-3">Sign in to join the discussion</p>
          <Button
            onClick={() => (window.location.href = "/auth/login")}
            variant="primary"
            className="w-full"
          >
            Sign In
          </Button>
        </div>
      )}
    </div>
  );
};
