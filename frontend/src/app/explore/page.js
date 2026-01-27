"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { postService } from "../lib/posts";
import { Spinner } from "../components/ui";
import { CategoryPostsSection } from "../components/explore/CategoryPostsSection";
import apiClient from "../lib/api";
import { API_ENDPOINTS } from "../lib/constants";

const CATEGORIES = [
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "entertainment", label: "Entertainment" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "technology", label: "Science & Tech" },
  { id: "community", label: "Community" },
];

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [categorizedPosts, setCategorizedPosts] = useState({});
  const [externalNews, setExternalNews] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [mounted, loading, isAuthenticated, router]);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchExternalNews();
      fetchCategorizedPosts();
    }
  }, [mounted, isAuthenticated]);

  const fetchExternalNews = async () => {
    setLoadingNews(true);
    try {
      const response = await apiClient.request(
        API_ENDPOINTS.GET_ALL_EXTERNAL_NEWS,
        {
          method: "GET",
        }
      );

      if (response.success && response.data) {
        setExternalNews(response.data);
      }
    } catch (error) {
      console.error("Error fetching external news:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchCategorizedPosts = async () => {
    setLoadingPosts(true);
    try {
      const allPosts = {};

      // Fetch posts for each category
      const fetchPromises = CATEGORIES.map(async (category) => {
        try {
          const response = await postService.getPosts({
            category: category.id,
            limit: 12, // Fetch more posts initially
          });
          if (response.posts && response.posts.length > 0) {
            allPosts[category.id] = {
              label: category.label,
              posts: response.posts,
            };
          }
        } catch (error) {
          console.error(`Error fetching ${category.id} posts:`, error);
        }
      });

      await Promise.all(fetchPromises);
      setCategorizedPosts(allPosts);
    } catch (error) {
      console.error("Error fetching categorized posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = loadingPosts || loadingNews;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Explore
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover posts from different categories
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Category Sections */}
        {!isLoading && (
          <div className="space-y-12">
            {CATEGORIES.map((category) => {
              // Get external news for this category
              const externalPosts = externalNews[category.id] || [];
              // Get internal posts for this category
              const internalPosts = categorizedPosts[category.id]?.posts || [];

              // Combine external news first, then internal posts
              // Deduplicate by _id to avoid React key conflicts
              const allPosts = [...externalPosts, ...internalPosts];
              const seenIds = new Set();
              const combinedPosts = allPosts.filter((post) => {
                if (seenIds.has(post._id)) {
                  return false;
                }
                seenIds.add(post._id);
                return true;
              });

              // Only render section if there are posts
              if (combinedPosts.length === 0) {
                return null;
              }

              return (
                <CategoryPostsSection
                  key={category.id}
                  categoryId={category.id}
                  categoryLabel={category.label}
                  posts={combinedPosts}
                />
              );
            })}

            {/* Show message if no posts in any category */}
            {CATEGORIES.every((category) => {
              const externalPosts = externalNews[category.id] || [];
              const internalPosts = categorizedPosts[category.id]?.posts || [];
              return externalPosts.length === 0 && internalPosts.length === 0;
            }) && (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No posts found in any category
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
