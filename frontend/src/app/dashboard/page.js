"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Spinner, Input } from "../components/ui";
import { PostFeed } from "../components/posts/PostFeed";
import { ROUTES } from "../lib/constants";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, loading, isAuthenticated, router]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab("search");
      setIsSearching(true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== "search") {
      setSearchQuery("");
      setIsSearching(false);
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Reddit-style Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href={ROUTES.DASHBOARD}>
                <h1 className="text-xl font-bold text-[#FF4500] cursor-pointer hover:text-[#ff5414]">
                  Hyper Thread
                </h1>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-6">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search Hyper Thread"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
              </form>
            </div>

            <div className="flex items-center gap-4">
              {/* Create Post Button */}
              <Link href={ROUTES.CREATE_POST}>
                <Button variant="primary" className="hidden sm:flex">
                  Create
                </Button>
                <Button variant="primary" className="sm:hidden px-3">
                  +
                </Button>
              </Link>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.firstName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center text-white font-bold">
                    {user.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.firstName} {user.lastName}
                </span>
              </div>

              <Button variant="outline" onClick={logout}>
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Reddit-style Navigation Tabs */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => handleTabChange("latest")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "latest"
                  ? "border-[#0079D3] text-[#0079D3]"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                Search: "{searchQuery}"
              </div>
            )}
          </div>

          {/* Create Post CTA - Inside the nav */}
          {activeTab !== "search" && (
            <div className="p-4">
              <Link href={ROUTES.CREATE_POST}>
                <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.firstName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {user.firstName?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 text-gray-500 dark:text-gray-400 text-left">
                    Create a post
                  </span>
                  <div className="flex gap-2">
                    <span className="text-gray-400">📝</span>
                    <span className="text-gray-400">🔗</span>
                    <span className="text-gray-400">📷</span>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Post Feed */}
        <PostFeed
          feedType={activeTab}
          searchQuery={activeTab === "search" ? searchQuery : ""}
        />
      </main>
    </div>
  );
}
