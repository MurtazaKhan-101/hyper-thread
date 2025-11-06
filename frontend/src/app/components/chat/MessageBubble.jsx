"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../ui";
import {
  MoreVertical,
  Reply,
  Smile,
  Edit,
  Trash2,
  Check,
  X,
} from "lucide-react";

export const MessageBubble = ({
  message,
  currentUser,
  onReaction,
  onReply,
  onEdit,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const actionMenuRef = useRef(null);
  const reactionsRef = useRef(null);

  const isOwnMessage = message.user._id === currentUser?._id;
  const isSystemMessage = message.messageType === "system";

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close action menu and reactions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        setShowActionMenu(false);
      }

      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target)
      ) {
        setShowReactions(false);
      }
    };

    if (showActionMenu || showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [showActionMenu, showReactions]);

  // Common emoji reactions
  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleEmojiClick = (emoji) => {
    onReaction?.(message._id, emoji);
    setShowReactions(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActionMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit?.(message._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
    setShowActionMenu(false);
  };

  const confirmDelete = () => {
    onDelete?.(message._id);
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowActionMenu(false);
  };

  // System message styling
  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full break-words break-all max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex mb-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        } max-w-[70%] overflow-visible`}
      >
        {/* Profile Image (for others' messages) */}
        {!isOwnMessage && (
          <div className="flex-shrink-0 mr-2">
            <Image
              src={message.user.profileImage || "/images/default-avatar.png"}
              alt={message.user.username}
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
        )}

        {/* Message Content */}
        <div className="relative group overflow-visible">
          {/* Message Bubble */}
          <div
            className={`relative px-3 py-2 rounded-2xl break-words ${
              isOwnMessage
                ? "bg-blue-500 text-white rounded-br-md"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* Username (for others' messages) */}
            {!isOwnMessage && (
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                {message.user.firstName} {message.user.lastName}
              </div>
            )}

            {/* Image Message */}
            {message.messageType === "image" && message.imageUrl && (
              <div className="mb-2">
                <Image
                  src={message.imageUrl}
                  alt="Shared image"
                  width={300}
                  height={200}
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}

            {/* Reply Reference */}
            {message.replyTo && (
              <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded border-l-4 border-blue-500 break-words overflow-hidden">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 break-words break-all">
                  Replying to{" "}
                  {message.replyTo.user
                    ? `${message.replyTo.user.firstName} ${message.replyTo.user.lastName}`
                    : "a user"}
                </div>
                <div
                  className="text-xs text-gray-600 dark:text-gray-400 break-words break-all hyphens-auto overflow-wrap-anywhere"
                  style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                >
                  {message.replyTo.messageType === "image"
                    ? "📷 Image"
                    : message.replyTo.content || "Message"}
                </div>
              </div>
            )}

            {/* Text Content */}
            {message.content && (
              <div
                className={`break-words break-all hyphens-auto overflow-wrap-anywhere ${
                  message.messageType === "image" ? "text-sm" : ""
                }`}
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none break-words"
                      rows="2"
                      autoFocus
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="p-1 text-green-600 bg-green-200 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-red-600 bg-red-200 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            )}

            {/* Timestamp */}
            <div
              className={`text-xs mt-1 ${
                isOwnMessage
                  ? "text-blue-100"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formatTime(message.timestamp)}
              {message.edited && (
                <span className="ml-1 text-xs opacity-70">(edited)</span>
              )}
            </div>

            {/* Action Button (always visible on hover) */}
            {!isEditing && (
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`absolute top-1 ${
                  isOwnMessage ? "left-[-30px]" : "right-[-30px]"
                } ${
                  isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } transition-opacity duration-200 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-lg z-10 ${
                  isMobile ? "touch-manipulation" : ""
                }`}
                title="Message actions"
              >
                <MoreVertical
                  size={16}
                  className="text-gray-700 dark:text-gray-300"
                />
              </button>
            )}

            {/* Action Menu */}
            {showActionMenu && !isEditing && (
              <div
                ref={actionMenuRef}
                className={`absolute ${isMobile ? "top-10" : "top-8"} ${
                  isOwnMessage
                    ? isMobile
                      ? "right-0"
                      : "left-[-120px]"
                    : isMobile
                    ? "left-0"
                    : "right-[-120px]"
                } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-20 ${
                  isMobile ? "min-w-[140px]" : "min-w-[120px]"
                }`}
              >
                <button
                  onClick={() => {
                    setShowReactions(!showReactions);
                    setShowActionMenu(false);
                  }}
                  className={`w-full ${
                    isMobile ? "px-4 py-3" : "px-3 py-2"
                  } text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    isMobile ? "touch-manipulation" : ""
                  }`}
                >
                  <Smile
                    size={isMobile ? 16 : 14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  React
                </button>
                <button
                  onClick={handleReply}
                  className={`w-full ${
                    isMobile ? "px-4 py-3" : "px-3 py-2"
                  } text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                    isMobile ? "touch-manipulation" : ""
                  }`}
                >
                  <Reply
                    size={isMobile ? 16 : 14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  Reply
                </button>
                {isOwnMessage && (
                  <>
                    {message.messageType !== "image" && (
                      <button
                        onClick={handleEdit}
                        className={`w-full ${
                          isMobile ? "px-4 py-3" : "px-3 py-2"
                        } text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                          isMobile ? "touch-manipulation" : ""
                        }`}
                      >
                        <Edit
                          size={isMobile ? 16 : 14}
                          className="text-gray-600 dark:text-gray-400"
                        />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className={`w-full ${
                        isMobile ? "px-4 py-3" : "px-3 py-2"
                      } text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 ${
                        isMobile ? "touch-manipulation" : ""
                      }`}
                    >
                      <Trash2
                        size={isMobile ? 16 : 14}
                        className="text-red-600 dark:text-red-400"
                      />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={`flex flex-wrap gap-1 mt-1 ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
                  acc[reaction.emoji].push(reaction);
                  return acc;
                }, {})
              ).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                    reactions.some((r) => r.user === currentUser?._id)
                      ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300"
                      : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                  title={`${reactions
                    .map((r) => r.user.firstName || r.user.username)
                    .join(", ")}`}
                >
                  {emoji} {reactions.length}
                </button>
              ))}
            </div>
          )}

          {/* Emoji Picker */}
          {showReactions && (
            <div
              ref={reactionsRef}
              className={`absolute ${isOwnMessage ? "right-0" : "left-0"} ${
                isMobile ? "bottom-full mb-2" : "mt-2"
              } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg z-20`}
            >
              <div className="flex space-x-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-transparent flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-medium text-gray-100 mb-2">
                Delete Message
              </h3>
              <p className="text-gray-400 mb-4">
                Are you sure you want to delete this message? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
                >
                  Cancel
                </button>
                <Button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
