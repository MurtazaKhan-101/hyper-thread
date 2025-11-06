"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Smile, X } from "lucide-react";

export const ChatInput = ({
  onSendMessage,
  onSendImage,
  onTyping,
  disabled,
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (selectedImage) {
      // Send image with optional caption
      onSendImage?.(selectedImage, trimmedMessage);
      clearImageSelection();
    } else if (trimmedMessage) {
      // Send text message
      onSendMessage?.(trimmedMessage);
    }

    setMessage("");
    setIsTyping(false);
    onTyping?.(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleEmojiClick = (emoji) => {
    const newMessage = message + emoji;
    setMessage(newMessage);
    inputRef.current?.focus();
  };

  return (
    <div className="border border-gray-800 bg-[#0f0f0f] p-4">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-32 max-h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={clearImageSelection}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedImage?.name}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* Image Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 my-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
          title="Send image"
        >
          <ImageIcon size={30} />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedImage ? "Add a caption..." : "Type a message..."
            }
            disabled={disabled}
            className="w-full px-4 py-2 mt-1.5 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-h-[40px] max-h-32"
            rows={1}
            style={{
              height: "auto",
              overflowY: message.length > 100 ? "auto" : "hidden",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 128) + "px";
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || (!message.trim() && !selectedImage)}
          className="flex-shrink-0 my-auto p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Character Limit Indicator */}
      {message.length > 800 && (
        <div className="mt-2 text-right">
          <span
            className={`text-xs ${
              message.length > 1000 ? "text-red-500" : "text-yellow-500"
            }`}
          >
            {message.length}/1000
          </span>
        </div>
      )}
    </div>
  );
};
