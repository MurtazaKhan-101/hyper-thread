"use client";

import { useState, useEffect } from "react";
import { feedService } from "../../lib/engagement";
import { PostCard } from "../posts/PostCard";
import { Spinner } from "../ui";
import { Sparkles } from "lucide-react";

export const SimilarPosts = ({ postId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      fetchSimilarPosts();
    }
  }, [postId]);

  const fetchSimilarPosts = async () => {
    try {
      setLoading(true);
      const response = await feedService.getSimilarPosts(postId, 3);
      setPosts(response.posts || []);
    } catch (error) {
      console.error("Error fetching similar posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Similar Posts
        </h3>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};
