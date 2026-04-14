"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { postService } from "../../lib/posts";
import { Spinner, Button } from "../../components/ui";
import { DiscussionLayout } from "../../components/discussion/DiscussionLayout";

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const postId = params.postId;

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
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Error Loading Post
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchPost} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Post Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <DiscussionLayout post={post} onPostUpdate={handlePostUpdate} />;
}
