"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { postService } from "../lib/posts";
import { Spinner } from "../components/ui";
import { CategoryPostsSection } from "../components/explore/CategoryPostsSection";

const CATEGORIES = [
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "music", label: "Music" },
  { id: "culture", label: "Culture" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health" },
  { id: "internet", label: "Internet" },
  { id: "history", label: "History" },
];

export default function ExplorePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [categorizedPosts, setCategorizedPosts] = useState({});
  const [loadingPosts, setLoadingPosts] = useState(true);

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
      fetchCategorizedPosts();
    }
  }, [mounted, isAuthenticated]);

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
        {loadingPosts && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Category Sections */}
        {!loadingPosts && (
          <div className="space-y-12">
            {Object.keys(categorizedPosts).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No posts found in any category
                </p>
              </div>
            ) : (
              Object.entries(categorizedPosts).map(
                ([categoryId, categoryData]) => (
                  <CategoryPostsSection
                    key={categoryId}
                    categoryId={categoryId}
                    categoryLabel={categoryData.label}
                    posts={categoryData.posts}
                  />
                )
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
