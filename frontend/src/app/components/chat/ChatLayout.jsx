"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostView } from "../discussion/PostView";
import { ChatRoom } from "../chat/ChatRoom";
import { ChevronLeft } from "lucide-react";

export const ChatLayout = ({ post, onPostUpdate, currentUser }) => {
  const router = useRouter();

  return (
    <div className="bg-gray-50 dark:bg-[#030303] w-full overflow-x-hidden mt-5">
      {/* Back button */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          <ChevronLeft className="inline-block mr-1" />
          Back to Posts
        </button>
      </div>

      {/* Main content - Split layout for desktop, stacked for mobile */}
      <div className="w-full mx-auto">
        {/* Desktop layout */}
        <div className="hidden md:flex h-[calc(100vh-80px)]">
          {/* Left side - Post content */}
          <div className="w-1/2 overflow-y-auto scrollbar-hide">
            <div className="p-6">
              <PostView
                post={post}
                onUpdate={onPostUpdate}
                isDiscussionView={true}
              />
            </div>
          </div>

          {/* Right side - Chat room */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-800">
            <ChatRoom post={post} currentUser={currentUser} />
          </div>
        </div>

        {/* Mobile layout - Stacked */}
        <div className="md:hidden">
          {/* Post content */}
          <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
            <div className="p-4">
              <PostView
                post={post}
                onUpdate={onPostUpdate}
                isDiscussionView={true}
              />
            </div>
          </div>

          {/* Chat room */}
          <div className="h-[60vh]">
            <ChatRoom post={post} currentUser={currentUser} />
          </div>
        </div>
      </div>
    </div>
  );
};
