"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  TrendingUp,
  Compass,
  ChevronUp,
  ChevronDown,
  X,
  Menu,
  Crown,
} from "lucide-react";

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const router = useRouter();
  const [topicsExpanded, setTopicsExpanded] = useState(true);
  const [resourcesExpanded, setResourcesExpanded] = useState(false);

  const mainMenuItems = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "trending", label: "Trending", icon: TrendingUp, href: "/dashboard" },
    { id: "explore", label: "Explore", icon: Compass, href: "/explore" },
    { id: "pricing", label: "Pricing", icon: Crown, href: "/pricing" },
  ];

  const topicsItems = [
    {
      id: "entertainment",
      label: "Entertainment",
      href: "/dashboard?category=entertainment",
    },
    { id: "sports", label: "Sports", href: "/dashboard?category=sports" },
    { id: "music", label: "Music", href: "/dashboard?category=music" },
    { id: "culture", label: "Culture", href: "/dashboard?category=culture" },
    {
      id: "technology",
      label: "Technology",
      href: "/dashboard?category=technology",
    },
    { id: "science", label: "Science", href: "/dashboard?category=science" },
    { id: "politics", label: "Politics", href: "/dashboard?category=politics" },
    { id: "business", label: "Business", href: "/dashboard?category=business" },
    { id: "health", label: "Health", href: "/dashboard?category=health" },
    { id: "internet", label: "Internet", href: "/dashboard?category=internet" },
    { id: "history", label: "History", href: "/dashboard?category=history" },
  ];

  const resourcesItems = [
    { id: "about", label: "About", href: "/about" },
    { id: "help", label: "Help", href: "/help" },
    { id: "terms", label: "Terms", href: "/community-rules" },
    { id: "privacy", label: "Privacy", href: "/privacy-policy" },
  ];

  const handleMenuClick = (href) => {
    if (href) {
      router.push(href);
    }
    setIsMobileOpen(false);
  };

  const isActive = (href) => {
    if (!href) return false;
    return router.pathname === href;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-transparent bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar-gradient text-black rounded-lg shadow-lg hover:bg-black hover:text-white transition-all duration-200"
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <div
        className={`
            fixed left-0 z-40 top-14
            bg-sidebar-gradient
            transition-all duration-300 ease-in-out
            h-[calc(100vh-3.5rem)] w-80 lg:w-72
            overflow-y-auto scrollbar-hide
            ${
              isMobileOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
            lg:block
            shadow-2xl
            `}
      >
        <div className="flex flex-col h-full text-white">
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden absolute top-4 right-1 p-2 rounded-lg text-black hover:bg-black hover:text-white transition-all duration-200"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}

          {/* Main Navigation */}
          <nav className="px-6 py-8 space-y-2">
            {mainMenuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.href)}
                  className={`
                    w-full flex items-center px-4 py-3 text-lg font-medium rounded-xl
                    transition-all duration-200 ease-in-out group
                    ${
                      active
                        ? "bg-buttons-gradient shadow-lg transform scale-105"
                        : "text-black hover:text-white hover:bg-black hover:shadow-md hover:transform hover:scale-105"
                    }
                  `}
                >
                  <Icon className="w-6 h-6 flex-shrink-0 mr-4" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-black border-opacity-20 mx-6"></div>

          {/* Topics Section */}
          <div className="px-6 py-4">
            <button
              onClick={() => setTopicsExpanded(!topicsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-lg text-black hover:text-white font-semibold rounded-xl hover:bg-black transition-all duration-200"
            >
              <span>Topics</span>
              {topicsExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {topicsExpanded && (
              <div className="mt-2 space-y-1 pl-4">
                {topicsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.href)}
                    className="w-full text-left px-4 py-2 text-black hover:text-white hover:bg-black hover:bg-opacity-80 rounded-lg transition-all duration-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-black border-opacity-20 mx-6"></div>

          {/* Resources Section */}
          <div className="px-6 py-4 flex-grow">
            <button
              onClick={() => setResourcesExpanded(!resourcesExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-lg text-black hover:text-white font-semibold rounded-xl hover:bg-black transition-all duration-200"
            >
              <span>Resources</span>
              {resourcesExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {resourcesExpanded && (
              <div className="mt-2 space-y-1 pl-4">
                {resourcesItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.href)}
                    className="w-full text-left px-4 py-2 text-black hover:bg-black hover:text-white hover:bg-opacity-80 rounded-lg transition-all duration-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
