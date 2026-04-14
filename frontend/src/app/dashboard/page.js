"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { Spinner, UpgradeModal, UpgradeBanner } from "../components/ui";
import { PostFeed } from "../components/posts/PostFeed";
import { ROUTES } from "../lib/constants";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Crown,
} from "lucide-react";
export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAuthenticated } = useAuth();
  const { activeTab, searchQuery, handleTabChange } = useSearch();
  const [mounted, setMounted] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get category and tab from URL params
  const category = searchParams.get("category") || "";
  const tabParam = searchParams.get("tab");

  // Check if user is premium
  const isPremium = user?.isPremium || false;
  const adminUser = user?.role === "admin";
  const hasPremiumAccess = isPremium || adminUser;

  // Category labels for display
  const categoryLabels = {
    entertainment: "Entertainment",
    sports: "Sports",
    music: "Music",
    culture: "Culture",
    internet: "Internet",
    history: "History",
    technology: "Technology",
    science: "Science",
    politics: "Politics",
    business: "Business",
    health: "Health",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle tab parameter from URL
  useEffect(() => {
    if (tabParam && ["personalized", "latest", "trending"].includes(tabParam)) {
      handleTabChange(tabParam);
    }
  }, [tabParam]);

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

  // Custom tab change handler that clears URL params
  const handleLocalTabChange = (tab) => {
    handleTabChange(tab);
    // Clear tab parameter from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const newUrl = params.toString()
      ? `/dashboard?${params.toString()}`
      : "/dashboard";
    router.replace(newUrl, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Reddit-style Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Left Column - Main Feed (Scrollable) */}
        <div className="min-h-0">
          {/* Gradient Tab Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              <button
                onClick={() => handleLocalTabChange("latest")}
                className={`relative px-3 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-black tracking-wide transition-all duration-200 ${activeTab === "latest"
                    ? "text-black dark:text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
              >
                LATEST
                <span
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-full bg-sidebar-gradient transition-all duration-200 ${activeTab === "latest" ? "opacity-100" : "opacity-0"
                    }`}
                />
              </button>

              <button
                onClick={() => handleLocalTabChange("trending")}
                className={`relative px-3 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-black tracking-wide transition-all duration-200 ${activeTab === "trending"
                    ? "text-black dark:text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
              >
                TRENDING
                <span
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-full bg-sidebar-gradient transition-all duration-200 ${activeTab === "trending" ? "opacity-100" : "opacity-0"
                    }`}
                />
              </button>

              <button
                onClick={() => handleLocalTabChange("personalized")}
                className={`relative px-3 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-black tracking-wide transition-all duration-200 ${activeTab === "personalized"
                    ? "text-black dark:text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
              >
                EXPLORE
                <span
                  className={`absolute bottom-0 left-0 right-0 h-1 rounded-full bg-sidebar-gradient transition-all duration-200 ${activeTab === "personalized" ? "opacity-100" : "opacity-0"
                    }`}
                />
              </button>

              {activeTab === "search" && (
                <div className="relative px-3 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-black tracking-wide text-black dark:text-white">
                  SEARCH: &ldquo;{searchQuery}&rdquo;
                  <span className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-sidebar-gradient" />
                </div>
              )}
            </div>
          </div>

          {/* Old Navigation Tabs - Removed */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6">
            {/* Create Post CTA */}
            {activeTab !== "search" && (
              <div className="p-4">
                {hasPremiumAccess ? (
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
                        <FileText className="w-5 h-5 text-gray-400 stroke-black transition-all duration-300" />
                        <LinkIcon className="w-5 h-5 text-gray-400 stroke-black transition-all duration-300" />
                        <ImageIcon className="w-5 h-5 text-gray-400 stroke-black transition-all duration-300" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    onClick={() => setShowUpgradeModal(true)}
                    className="flex items-center gap-3 p-3 border-2 border-dashed border-yellow-300 dark:border-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-lg hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/20 dark:hover:to-orange-900/20 transition-colors cursor-pointer"
                  >
                    {/* Premium Icon */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Crown className="w-4 h-4 text-white" />
                    </div>

                    {/* Placeholder text */}
                    <span className="flex-1 text-gray-700 dark:text-gray-300 text-left font-medium">
                      Upgrade to create posts
                    </span>

                    {/* Lucide Icons - dimmed */}
                    <div className="flex gap-3 opacity-50">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <LinkIcon className="w-5 h-5 text-gray-400" />
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )}
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
                <h3 className="text-black font-semibold text-sm">
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
                    src="/images/NEWS_NET-V2.svg"
                    alt="newsnatter Logo"
                    width={80}
                    height={80}
                    className="hidden sm:inline"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  &copy; {new Date().getFullYear()} newsnatter. All rights
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="post"
      />
    </div>
  );
}
