"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { Spinner } from "../components/ui";
import { PostFeed } from "../components/posts/PostFeed";
import { ROUTES } from "../lib/constants";
import Link from "next/link";
import Image from "next/image";
import { FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAuthenticated } = useAuth();
  const { activeTab, searchQuery, handleTabChange } = useSearch();
  const [mounted, setMounted] = useState(false);

  // Get category from URL params
  const category = searchParams.get("category") || "";

  // Category labels for display
  const categoryLabels = {
    sports: "Sports",
    culture: "Culture",
    internet: "Internet",
    history: "History",
    entertainment: "Entertainment",
    technology: "Technology",
    science: "Science",
    politics: "Politics",
    business: "Business",
    health: "Health",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, loading, isAuthenticated, router]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Reddit-style Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Left Column - Main Feed (Scrollable) */}
        <div className="min-h-0">
          {/* Reddit-style Navigation Tabs */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6top-20">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => handleTabChange("latest")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "latest"
                    ? "border-[#0079D3] text-[#0079D3]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Latest
              </button>

              <button
                onClick={() => handleTabChange("trending")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "trending"
                    ? "border-[#0079D3] text-[#0079D3]"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Trending
              </button>

              {activeTab === "search" && (
                <div className="flex items-center px-6 py-3 text-sm font-medium border-b-2 border-[#0079D3] text-[#0079D3]">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search: &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Create Post CTA - Inside the nav */}
            {activeTab !== "search" && (
              <div className="p-4">
                <Link href={ROUTES.CREATE_POST}>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {user?.profileImage ? (
                        <Image
                          src={user.profileImage}
                          alt={user.firstName}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {user?.firstName?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>

                    {/* Placeholder text */}
                    <span className="flex-1 text-gray-500 dark:text-gray-400 text-left">
                      Create a post
                    </span>

                    {/* Lucide Icons */}
                    <div className="flex gap-3">
                      <FileText className="w-5 h-5 text-gray-400 stroke-blue-500 transition-all duration-300" />
                      <LinkIcon className="w-5 h-5 text-gray-400 stroke-blue-500 transition-all duration-300" />
                      <ImageIcon className="w-5 h-5 text-gray-400 stroke-blue-500 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Category Header */}
          {category && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {categoryLabels[category] || category}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Category
                  </span>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All Posts
                </button>
              </div>
            </div>
          )}

          {/* Post Feed - Scrollable Content */}
          <div className="pb-8">
            <PostFeed
              feedType={activeTab}
              searchQuery={activeTab === "search" ? searchQuery : ""}
              category={category}
            />
          </div>
        </div>

        {/* Right Column - Sidebar (Fixed/Non-scrollable) */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-6">
            {/* Recent Activities Section */}
            {/* <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                <h3 className="text-white font-semibold text-sm">
                  Recent Activities
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {user?.username || "User"}
                      </span>{" "}
                      created a new post
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      2 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      New trending post in{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        Technology
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      5 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      Community milestone:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        1000 members
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      1 day ago
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/activity"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                  >
                    View all activity →
                  </Link>
                </div>
              </div>
            </div> */}

            {/* Community Guidelines */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-buttons-gradient px-4 py-3">
                <h3 className="text-white font-semibold text-sm">
                  Community Guidelines
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>Be respectful and civil</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>No spam or self-promotion</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>Keep content relevant</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/community-rules"
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-xs font-medium"
                  >
                    Read full rules →
                  </Link>
                </div>
              </div>
            </div>

            {/* Trademark/Footer */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Image
                    src="/images/NEWS_NET.svg"
                    alt="News Natter Logo"
                    width={80}
                    height={80}
                    className="hidden sm:inline"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  &copy; {new Date().getFullYear()} News Natter. All rights
                  reserved.
                </p>
                <div className="flex justify-center gap-4 text-xs">
                  <Link
                    href="/privacy-policy"
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/community-rules"
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Terms
                  </Link>
                  <Link
                    href="/help"
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Help
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
