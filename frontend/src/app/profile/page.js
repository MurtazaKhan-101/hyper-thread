"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { postService } from "../lib/posts";
import { useRouter } from "next/navigation";
import { PostCard } from "../components/posts/PostCard";
import { Spinner } from "../components/ui";
import {
  Edit,
  Trash2,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../components/ui";

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserPosts();
    }
  }, [user, page]);

  const loadUserPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await postService.getPosts({
        author: user._id,
        page,
        limit: 10,
        sort: "newest",
      });

      if (response.success) {
        if (page === 1) {
          setUserPosts(response.posts);
        } else {
          setUserPosts((prev) => [...prev, ...response.posts]);
        }
        setHasMore(response.pagination.hasNext);
      }
    } catch (err) {
      console.error("Error loading user posts:", err);
      setError("Failed to load your posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEditClick = (postId) => {
    setOpenMenuId(null);
    router.push(`/edit-post/${postId}`);
  };

  const toggleMenu = (postId) => {
    setOpenMenuId(openMenuId === postId ? null : postId);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      const response = await postService.deletePost(postToDelete._id);

      if (response.success) {
        // Remove post from list
        setUserPosts((prev) =>
          prev.filter((post) => post._id !== postToDelete._id)
        );
        setDeleteModalOpen(false);
        setPostToDelete(null);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden mt-5 scrollbar-hide">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            <ChevronLeft className="inline-block mr-1" />
            Back to Posts
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-24 h-24 rounded-full border-4 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName?.[0]?.toUpperCase()}
                  {user.lastName?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                @{user.username}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {user.email}
              </p>

              {/* Stats */}
              <div className="flex gap-6 mt-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.stats?.likesReceived || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Likes
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.stats?.commentsCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Comments
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Your Posts
        </h2>

        {isLoading && page === 1 ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500">{error}</p>
            <button
              onClick={() => loadUserPosts()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start sharing your thoughts with the community!
            </p>
            <button
              onClick={() => router.push("/create-post")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <div key={post._id} className="relative">
                <PostCard post={post} />

                {/* Action Menu Button */}
                <div className="absolute top-4 right-4 action-menu-container">
                  <button
                    onClick={() => toggleMenu(post._id)}
                    className="p-1 sm:p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg border border-gray-200 dark:border-gray-700"
                    title="Post actions"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === post._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={() => handleEditClick(post._id)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit size={16} />
                        <span>Edit Post</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(post)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>Delete Post</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <Button
                  onClick={() => setPage((prev) => prev + 1)}
                  variant="outline"
                  disabled={isLoading}
                  className="min-w-32"
                >
                  <span className="flex items-center justify-center min-w-[80px]">
                    {isLoading ? <Spinner size="sm" /> : "Load More"}
                  </span>
                </Button>
                {/* <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button> */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Post
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
