"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { postService } from "../../lib/posts";
import { Spinner, Button, UpgradeBanner } from "../../components/ui";
import { ChatLayout } from "../../components/chat/ChatLayout";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const postId = params.postId;

  // Check if user is premium
  const isPremium = user?.isPremium || false;
  const adminUser = user?.role === "admin";
  const hasPremiumAccess = isPremium || adminUser;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (postId && isAuthenticated) {
      fetchPost();
    }
  }, [postId, isAuthenticated, loading]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await postService.getPostById(postId);
      setPost(response.post);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load post");
      console.error("Error fetching post:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostUpdate = () => {
    fetchPost();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Loading chat room...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Load Chat Room
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button onClick={fetchPost} variant="primary" className="flex-1">
                Try Again
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Post Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="primary"
              fullWidth
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if user is not premium
  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Chat Room: {post.title}
            </h2>
            <UpgradeBanner feature="chat" />
            <div className="mt-6">
              <Button
                onClick={() => router.push(`/discussion/${post._id}`)}
                variant="outline"
                fullWidth
              >
                View Discussion Instead
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatLayout
      post={post}
      onPostUpdate={handlePostUpdate}
      currentUser={user}
    />
  );
}
