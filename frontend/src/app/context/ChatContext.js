"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import chatService from "../lib/chat";

const ChatContext = createContext(undefined);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  //   const [typingUsers, setTypingUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastJoinAttempt, setLastJoinAttempt] = useState(0);
  const [chatRoom, setChatRoom] = useState(null);
  const [participantUpdateTimeout, setParticipantUpdateTimeout] =
    useState(null);
  const [hasLoadedInitialMessages, setHasLoadedInitialMessages] =
    useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);

  // Debounced participant updates to prevent rapid UI changes
  const updateParticipantsDebounced = useCallback(
    (updaterFunction) => {
      if (participantUpdateTimeout) {
        clearTimeout(participantUpdateTimeout);
      }

      const timeout = setTimeout(() => {
        setParticipants(updaterFunction);
        setParticipantUpdateTimeout(null);
      }, 200); // 200ms debounce

      setParticipantUpdateTimeout(timeout);
    },
    [participantUpdateTimeout]
  );

  // Helper: dedupe messages by _id (preserve first occurrence order)
  const dedupeMessages = (msgs = []) => {
    const seen = new Set();
    const out = [];
    for (const m of msgs) {
      const id = m && (m._id || m.id || `${m.timestamp || ""}`);
      if (!id) {
        // if no id, push anyway but avoid exact duplicates by JSON
        const key = JSON.stringify(m);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(m);
        }
      } else if (!seen.has(id)) {
        seen.add(id);
        out.push(m);
      }
    }
    return out;
  };
  // Connect to chat service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // console.log("👤 User authenticated, attempting chat connection...");
      // Get token from API client
      const connectToService = async () => {
        try {
          // Import the API client to get the token
          const { default: apiClient } = await import("../lib/api");
          const token = apiClient.getAccessToken();

          if (token) {
            // console.log("🔑 Access token found, connecting to chat...");
            await connectToChat(token);
          } else {
            console.warn("⚠️ No access token available for chat connection");
            setError("Authentication required for chat");
          }
        } catch (error) {
          console.error("❌ Failed to get access token for chat:", error);
          setError("Failed to authenticate chat connection");
        }
      };

      connectToService();
    } else {
      // console.log("🚪 User not authenticated, disconnecting chat...");
      disconnectFromChat();
    }

    return () => {
      disconnectFromChat();
      // Clean up any pending participant updates
      if (participantUpdateTimeout) {
        clearTimeout(participantUpdateTimeout);
      }
    };
  }, [isAuthenticated, user]);

  const connectToChat = async (token) => {
    try {
      // console.log("🔌 Attempting to connect to chat service...");

      // Set up event listeners first
      const cleanup = setupEventListeners();

      // Then connect
      await chatService.connect(token);

      // console.log("✅ Chat service connected successfully");

      // Store cleanup function for later
      window.chatCleanup = cleanup;
    } catch (error) {
      console.error("❌ Failed to connect to chat:", error);
      setError("Failed to connect to chat server");
      setIsConnected(false);
    }
  };

  const setupEventListeners = () => {
    // console.log("🎧 Setting up chat event listeners...");

    // Connection status
    const unsubscribeConnection = chatService.onConnection((connected) => {
      // console.log("🔗 Connection status changed:", connected);
      setIsConnected(connected);
      // Don't clear messages and participants on disconnect - keep them cached
      // Only clear the room if explicitly leaving
    });

    // New messages
    const unsubscribeMessages = chatService.onNewMessage((data) => {
      // Merge incoming message and dedupe to avoid duplicates
      setMessages((prev) => dedupeMessages([...prev, data.message]));

      // Update typing status when user sends message
      //   if (data.message.user._id !== user?._id) {
      //     setTypingUsers((prev) => {
      //       const updated = new Set(prev);
      //       updated.delete(data.message.user._id);
      //       return updated;
      //     });
      //   }
    });

    // User events (join/leave)
    const unsubscribeUserEvents = chatService.onUserEvent((event) => {
      switch (event.type) {
        case "joinedRoom":
          setCurrentRoom(event.data.roomId);
          // Set participants from the complete list provided by server
          setParticipants(event.data.participants || []);
          break;
        case "userJoined":
          updateParticipantsDebounced((prev) => {
            // Check if user is already in the list to prevent duplicates
            const exists = prev.some((p) => p.user._id === event.data.user._id);
            if (!exists) {
              return [
                ...prev,
                {
                  user: event.data.user,
                  joinedAt: event.data.timestamp,
                  isActive: true,
                },
              ];
            }
            // If exists, just update their active status
            return prev.map((p) =>
              p.user._id === event.data.user._id
                ? { ...p, isActive: true, lastSeen: event.data.timestamp }
                : p
            );
          });
          break;
        case "userLeft":
          updateParticipantsDebounced((prev) =>
            prev.filter((p) => p.user._id !== event.data.userId)
          );
          //   setTypingUsers((prev) => {
          //     const updated = new Set(prev);
          //     updated.delete(event.data.userId);
          //     return updated;
          //   });
          break;
        case "leftRoom":
          setCurrentRoom(null);
          setMessages([]);
          setParticipants([]);
          //   setTypingUsers(new Set());
          break;
      }
    });

    // Typing indicators
    // const unsubscribeTyping = chatService.onTyping((data) => {
    //   if (data.userId === user?._id) return; // Don't show own typing

    //   setTypingUsers((prev) => {
    //     const updated = new Set(prev);
    //     if (data.isTyping) {
    //       updated.add(data.userId);
    //     } else {
    //       updated.delete(data.userId);
    //     }
    //     return updated;
    //   });

    //   // Auto-remove typing indicator after 3 seconds
    //   if (data.isTyping) {
    //     setTimeout(() => {
    //       setTypingUsers((prev) => {
    //         const updated = new Set(prev);
    //         updated.delete(data.userId);
    //         return updated;
    //       });
    //     }, 3000);
    //   }
    // });

    // Reactions
    const unsubscribeReactions = chatService.onReaction((data) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === data.messageId
            ? { ...message, reactions: data.reactions }
            : message
        )
      );
    });

    // Message edits
    const unsubscribeMessageEdits = chatService.onMessageEdit((data) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === data.messageId
            ? {
                ...message,
                content: data.content,
                edited: data.edited,
                editedAt: data.editedAt,
              }
            : message
        )
      );
    });

    // Message deletions
    const unsubscribeMessageDeletes = chatService.onMessageDelete((data) => {
      setMessages((prev) =>
        prev.filter((message) => message._id !== data.messageId)
      );
    });

    // Errors
    const unsubscribeErrors = chatService.onError((error) => {
      setError(error.message || "Chat error occurred");
    });

    // Cleanup function
    return () => {
      unsubscribeConnection();
      unsubscribeMessages();
      unsubscribeUserEvents();
      // unsubscribeTyping();
      unsubscribeReactions();
      unsubscribeMessageEdits();
      unsubscribeMessageDeletes();
      unsubscribeErrors();
    };
  };

  const disconnectFromChat = () => {
    // console.log("🔌 Disconnecting from chat service...");

    // Clean up event listeners
    if (window.chatCleanup) {
      window.chatCleanup();
      window.chatCleanup = null;
    }

    chatService.disconnect();
    setIsConnected(false);
    setCurrentRoom(null);
    setMessages([]);
    setParticipants([]);
    // setTypingUsers(new Set());
    setError(null);
  };

  // Join a chat room
  const joinRoom = useCallback(
    async (postId) => {
      // Rate limiting: prevent rapid join attempts
      const now = Date.now();
      if (now - lastJoinAttempt < 3000) {
        // 3 second cooldown
        console.log("⚠️ Rate limiting: Too soon to join room again");
        return;
      }
      setLastJoinAttempt(now);

      if (!isConnected) {
        setError("Not connected to chat server");
        return;
      }

      // Check if already in the room
      if (currentRoom === `post_${postId}`) {
        // console.log("Already in room:", postId);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get chat room data first (single API call)
        const roomResponse = await chatService.getChatRoom(postId);
        setChatRoom(roomResponse.data.chatRoom);
        const initialMessages = dedupeMessages(
          roomResponse.data.chatRoom.messages || []
        );
        setMessages(initialMessages);
        setParticipants(roomResponse.data.chatRoom.participants || []);
        setHasLoadedInitialMessages(true);

        // Backend returns last 50 messages by default
        // If we got fewer than 50, there are no more messages to load
        setTotalMessageCount(initialMessages.length);

        // Join via socket only (no duplicate API call)
        await chatService.joinRoom(postId);
      } catch (error) {
        console.error(
          "Error joining room:",
          error?.response?.data || error?.message || error
        );
        setError(error.message || "Failed to join chat room");
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, lastJoinAttempt, currentRoom]
  );

  // Leave current room
  const leaveRoom = useCallback(async () => {
    if (!currentRoom) return;

    try {
      // Leave via socket only (no duplicate API call)
      await chatService.leaveRoom();
    } catch (error) {
      console.error(
        "Error leaving room:",
        error?.response?.data || error?.message || error
      );
      setError(error.message || "Failed to leave chat room");
    }
  }, [currentRoom]);

  // Send a message
  const sendMessage = useCallback(
    (content) => {
      if (!isConnected || !currentRoom) {
        setError("Not connected to chat room");
        return;
      }

      try {
        chatService.sendMessage(content);
        // Stop typing indicator when sending message
        // chatService.stopTyping();
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message");
      }
    },
    [isConnected, currentRoom]
  );

  // Send typing indicator
  // const sendTyping = useCallback(
  //   (isTyping) => {
  //     if (!isConnected || !currentRoom) return;

  //     try {
  //       if (isTyping) {
  //         chatService.startTyping();
  //       } else {
  //         chatService.stopTyping();
  //       }
  //     } catch (error) {
  //       console.error("Error sending typing indicator:", error);
  //     }
  //   },
  //   [isConnected, currentRoom]
  // );

  // Add reaction to message
  const addReaction = useCallback(
    (messageId, emoji) => {
      if (!isConnected || !currentRoom) return;

      try {
        chatService.addReaction(messageId, emoji);
      } catch (error) {
        console.error("Error adding reaction:", error);
        setError("Failed to add reaction");
      }
    },
    [isConnected, currentRoom]
  );

  // Upload and send image
  const sendImage = useCallback(
    async (file, caption = "") => {
      if (!isConnected || !currentRoom) {
        setError("Not connected to chat room");
        return;
      }

      try {
        const postId = currentRoom.replace("post_", "");
        const uploadResponse = await chatService.uploadChatImage(postId, file);

        if (uploadResponse.success) {
          chatService.sendImageMessage(uploadResponse.data.imageUrl, caption);
        }
      } catch (error) {
        console.error("Error sending image:", error);
        setError("Failed to send image");
      }
    },
    [isConnected, currentRoom]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (postId, before = null) => {
    try {
      // Use only the getChatHistory API call, not getChatRoom again
      const response = await chatService.getChatHistory(postId, 1, 50, before);
      const olderMessages = response.data.messages;

      if (olderMessages.length > 0) {
        setMessages((prev) => dedupeMessages([...olderMessages, ...prev]));
      }

      return response.data.pagination.hasMore;
    } catch (error) {
      console.error("Error loading more messages:", error);
      setError("Failed to load more messages");
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Send a reply to a message
  const sendReply = useCallback(
    (content, replyToMessageId) => {
      if (!isConnected || !currentRoom) {
        setError("Not connected to chat room");
        return;
      }

      try {
        chatService.sendReply(content, replyToMessageId);
        // Stop typing indicator when sending message
        // chatService.stopTyping();
      } catch (error) {
        console.error("Error sending reply:", error);
        setError("Failed to send reply");
      }
    },
    [isConnected, currentRoom]
  );

  // Edit a message
  const editMessage = useCallback(
    (messageId, content) => {
      if (!isConnected || !currentRoom) {
        setError("Not connected to chat room");
        return;
      }

      try {
        chatService.editMessage(messageId, content);
      } catch (error) {
        console.error("Error editing message:", error);
        setError("Failed to edit message");
      }
    },
    [isConnected, currentRoom]
  );

  // Delete a message
  const deleteMessage = useCallback(
    (messageId) => {
      if (!isConnected || !currentRoom) {
        setError("Not connected to chat room");
        return;
      }

      try {
        chatService.deleteMessage(messageId);
      } catch (error) {
        console.error("Error deleting message:", error);
        setError("Failed to delete message");
      }
    },
    [isConnected, currentRoom]
  );

  // Utility functions
  const isInRoom = useCallback(
    (postId) => currentRoom === `post_${postId}`,
    [currentRoom]
  );

  const getParticipantCount = useCallback(
    () => participants.length,
    [participants.length]
  );

  const getMessageCount = useCallback(() => messages.length, [messages.length]);

  const value = {
    // State
    isConnected,
    currentRoom,
    messages,
    participants,
    // typingUsers: Array.from(typingUsers),
    isLoading,
    error,
    chatRoom,
    hasLoadedInitialMessages,
    totalMessageCount,

    // Actions
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

    // Utils
    isInRoom,
    getParticipantCount,
    getMessageCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatContext;
