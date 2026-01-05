"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useSearch } from "../../context/SearchContext";
import { useSearchTracking } from "../../hooks/useEngagementTracking";
import { ROUTES } from "../../lib/constants";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

const Topbar = ({ setIsMobileOpen }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    handleSearch: contextHandleSearch,
    searchQuery,
    setSearchQuery,
  } = useSearch();
  const { trackSearch } = useSearchTracking();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      contextHandleSearch(localSearchQuery);
      trackSearch(localSearchQuery); // Track search engagement
      setLocalSearchQuery(""); // Clear the input after search
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 w-full py-2">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left Section - Logo */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1 sm:p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <Link href={ROUTES.DASHBOARD}>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-clip-text text-bg-buttons-gradient cursor-pointer hover:opacity-80 transition-opacity">
                {/* <span className="hidden sm:inline">newsnatter</span> */}
                <Image
                  src="/images/NEWS_NET-V2.svg"
                  alt="newsnatter Logo"
                  width={150}
                  height={150}
                  className="hidden sm:inline"
                />
              </h1>
            </Link>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-2xl mx-2 relative left-0.5 sm:mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative p-0.5 moving-border hover:moving-border-fast rounded-full transition-all duration-300">
                <div className="relative bg-white dark:bg-gray-800 rounded-full">
                  <svg
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10"
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
                  <input
                    type="text"
                    placeholder="Search newsnatter"
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-transparent border-none rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            {/* Create Button */}
            <Link href={ROUTES.CREATE_POST}>
              <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-buttons-gradient text-black border-none rounded-lg hover:bg-ui-cards-gradient hover:scale-105 transition-all duration-200 shadow-md">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden md:inline ">Create</span>
              </button>
            </Link>

            {/* Notifications - Hidden on very small screens */}
            {/* <button className="hidden xs:block p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-white hover:bg-black rounded-lg transition-all duration-200 hover:scale-105">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-3.5-3.5a1.5 1.5 0 01-.44-1.06V9a6 6 0 00-6-6 6 6 0 00-6 6v3.44c0 .4-.16.78-.44 1.06L0 17h5m10 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button> */}

            {/* User Profile with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                {user?.profileImage ? (
                  <div className="rounded-full p-0.5 bg-buttons-gradient hover:bg-ui-cards-gradient hover:scale-105 transition-all duration-200">
                    <Image
                      src={user.profileImage}
                      alt={user.firstName}
                      width={30}
                      height={30}
                      className="rounded-full sm:w-[34px] sm:h-[34px]"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-buttons-gradient flex items-center justify-center text-white font-semibold text-xs sm:text-sm hover:bg-ui-cards-gradient hover:scale-110 transition-all duration-200 shadow-md">
                    {user?.firstName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}

                {/* Hidden on small screens - User name and dropdown arrow */}
                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {/* User Info - Mobile Only */}
                    <div className="sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        {user?.profileImage ? (
                          <Image
                            src={user.profileImage}
                            alt={user.firstName}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-buttons-gradient flex items-center justify-center text-white font-semibold">
                            {user?.firstName?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-[0.60rem] sm:text-sm text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </Link>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}

              {/* Click outside to close dropdown */}
              {isProfileDropdownOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileDropdownOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
