"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
// import { TypingIndicator } from "./TypingIndicator";
import { Spinner } from "../ui";
import { Users, Wifi, WifiOff, ChevronUp } from "lucide-react";
import { useMemo } from "react";

export const ChatRoom = ({ post, currentUser }) => {
  const {
    isConnected,
    messages,
    participants,
    // typingUsers,
    isLoading,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    // sendTyping,
    addReaction,
    sendImage,
    sendReply,
    editMessage,
    deleteMessage,
    loadMoreMessages,
    clearError,
    isInRoom,
  } = useChat();

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const hasJoinedRef = useRef(false); // Track if we've already attempted to join
  const joinInProgressRef = useRef(false); // Track if join is currently in progress

  // Reset join tracking when post changes
  useEffect(() => {
    hasJoinedRef.current = false;
    joinInProgressRef.current = false;
    setHasMoreMessages(true); // Reset has more messages when switching rooms
  }, [post?._id]);

  // Join room on mount
  useEffect(() => {
    if (
      post?._id &&
      isConnected &&
      !isInRoom(post._id) &&
      !hasJoinedRef.current &&
      !joinInProgressRef.current
    ) {
      console.log("🚪 ChatRoom: Joining room for the first time:", post._id);
      hasJoinedRef.current = true;
      joinInProgressRef.current = true;

      joinRoom(post._id).finally(() => {
        joinInProgressRef.current = false;
      });
    }

    return () => {
      if (isInRoom(post._id)) {
        console.log("🚪 ChatRoom: Leaving room on cleanup:", post._id);
        leaveRoom();
        hasJoinedRef.current = false;
        joinInProgressRef.current = false;
      }
    };
  }, [post?._id, isConnected, isInRoom]); // Now isInRoom is properly memoized

  // Scroll to bottom when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (!hasScrolledUp && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, hasScrolledUp]);

  // Handle scroll for detecting bottom position only
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setHasScrolledUp(!isAtBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  };

  const loadMoreHistoryMessages = async () => {
    if (isLoadingMore || messages.length === 0 || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const hasMore = await loadMoreMessages(
        post._id,
        oldestMessage?.timestamp
      );

      setHasMoreMessages(hasMore);

      if (!hasMore) {
        console.log("No more messages to load");
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = (content) => {
    if (replyingTo) {
      sendReply(content, replyingTo._id);
      setReplyingTo(null);
    } else {
      sendMessage(content);
    }
    setHasScrolledUp(false); // Auto-scroll to bottom after sending
  };

  const handleSendImage = async (file, caption) => {
    await sendImage(file, caption);
    setHasScrolledUp(false); // Auto-scroll to bottom after sending
  };

  //   const handleTyping = (isTyping) => {
  //     sendTyping(isTyping);
  //   };

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleEdit = (messageId, content) => {
    editMessage(messageId, content);
  };

  const handleDelete = (messageId) => {
    deleteMessage(messageId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Get unique active participants
  const activeParticipants = useMemo(() => {
    const uniqueParticipants = new Map();
    participants
      .filter((p) => p.isActive !== false) // Include if isActive is true or undefined
      .forEach((p) => {
        uniqueParticipants.set(p.user._id, p);
      });
    return Array.from(uniqueParticipants.values());
  }, [participants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Joining chat room...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-chat-gradient">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="font-semibold text-white">Chat Room</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-300 ">
              {isConnected ? (
                <>
                  <Wifi size={14} className="text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-500" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Users size={16} />
          <span>{activeParticipants.length}</span>
        </button>
      </div>

      {/* Participants Panel */}
      {showParticipants && (
        <div className="p-4 border-b border-gray-200border-gray-800">
          <h4 className="font-medium text-white mb-2">
            Participants ({activeParticipants.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeParticipants.map((participant) => (
              <div
                key={participant.user._id}
                className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-full text-sm"
              >
                <img
                  src={
                    participant.user.profileImage ||
                    "/images/default-avatar.png"
                  }
                  alt={participant.user.username}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  {participant.user.firstName} {participant.user.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* Load Older Messages Button */}
        {messages.length > 0 && hasMoreMessages && (
          <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700 mb-2">
            <button
              onClick={loadMoreHistoryMessages}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {isLoadingMore ? (
                <>
                  <Spinner size="sm" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronUp size={16} />
                  Load Older Messages
                </>
              )}
            </button>
          </div>
        )}

        {/* No More Messages Indicator */}
        {messages.length > 0 && !hasMoreMessages && (
          <div className="flex justify-center py-2 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              Beginning of conversation
            </span>
          </div>
        )}

        {/* Loading More Indicator (for backwards compatibility) */}
        {isLoadingMore && !hasMoreMessages && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">💬</p>
              <p>No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message._id || `message-${index}`}
              message={message}
              currentUser={currentUser}
              onReaction={handleReaction}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* Typing Indicator */}
        {/* <TypingIndicator typingUsers={typingUsers} /> */}

        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {hasScrolledUp && messages.length > 0 && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={() => {
              scrollToBottom();
              setHasScrolledUp(false);
            }}
            className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
            title="Scroll to bottom"
          >
            ↓
          </button>
        </div>
      )}

      {/* Reply Context */}
      {replyingTo && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 break-words overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-600 dark:text-gray-400 break-words break-all">
                Replying to {replyingTo.user.firstName}{" "}
                {replyingTo.user.lastName}
              </div>
              <div
                className="text-sm text-gray-800 dark:text-gray-200 mt-1 break-words break-all hyphens-auto overflow-wrap-anywhere"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {replyingTo.content ||
                  (replyingTo.messageType === "image" ? "📷 Image" : "Message")}
              </div>
            </div>
            <button
              onClick={handleCancelReply}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onSendImage={handleSendImage}
        // onTyping={handleTyping}
        disabled={!isConnected}
        replyingTo={replyingTo}
      />
    </div>
  );
};
