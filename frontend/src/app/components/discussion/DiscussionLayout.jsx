"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostView } from "./PostView";
import { DiscussionPanel } from "./DiscussionPanel";
import { Button } from "../ui";

export const DiscussionLayout = ({ post, onPostUpdate }) => {
  const router = useRouter();
  const [comments, setComments] = useState(post?.comments || []);

  useEffect(() => {
    setComments(post?.comments || []);
  }, [post?.comments]);

  const handleCommentsUpdate = (updatedComments) => {
    setComments(updatedComments);
  };

  // Create updated post object with current comments for PostView
  const postWithUpdatedComments = {
    ...post,
    comments: comments,
  };

  return (
    <div className="bg-gray-50 dark:bg-[#030303] w-full overflow-x-hidden mt-5">
      {/* Header with back button */}
      {/* <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 mt-4">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="flex items-center gap-2"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Feed
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Discussion
            </h1>
          </div>
        </div>
      </div> */}

      {/* Main content - Split layout for desktop, stacked for mobile */}
      <div className="w-full mx-auto">
        {/* Desktop layout */}
        <div className="hidden md:flex h-[calc(100vh-80px)]">
          {/* Left side - Post content */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6">
              <PostView
                post={postWithUpdatedComments}
                onUpdate={onPostUpdate}
                isDiscussionView={true}
              />
            </div>
          </div>

          {/* Right side - Discussion panel (reduced width) */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
            <DiscussionPanel
              post={post}
              comments={comments}
              onCommentsUpdate={handleCommentsUpdate}
            />
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden w-full overflow-hidden">
          {/* Post content */}
          <div className="p-4 w-full overflow-hidden">
            <PostView
              post={postWithUpdatedComments}
              onUpdate={onPostUpdate}
              isDiscussionView={true}
            />
          </div>

          {/* Discussion panel below post */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] min-h-[60vh] w-full overflow-hidden">
            <DiscussionPanel
              post={post}
              comments={comments}
              onCommentsUpdate={handleCommentsUpdate}
              isMobile={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
