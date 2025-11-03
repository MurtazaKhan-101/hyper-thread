"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PostView } from "./PostView";
import { DiscussionPanel } from "./DiscussionPanel";
import { ChevronLeft } from "lucide-react";

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
                post={postWithUpdatedComments}
                onUpdate={onPostUpdate}
                isDiscussionView={true}
              />
            </div>
          </div>

          {/* Right side - Discussion panel*/}
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
