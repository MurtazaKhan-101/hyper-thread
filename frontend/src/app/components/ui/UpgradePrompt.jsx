"use client";

import { useRouter } from "next/navigation";
import { X, Crown, Check, MessageCircleWarning } from "lucide-react";
import { Button } from "../ui";

export const UpgradeModal = ({ isOpen, onClose, feature }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const features = [
    "Create unlimited posts",
    "Comment on any discussion",
    "Join live chat rooms",
    "Get priority support",
    "No ads experience",
  ];

  const getFeatureMessage = () => {
    switch (feature) {
      case "post":
        return "Create Posts";
      case "comment":
        return "Add Comments";
      case "chat":
        return "Join Chat Rooms";

      default:
        return "Access Premium Features";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto scrollbar-hide">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-slideUp my-8 max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="relative p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Upgrade to Premium
              </h2>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-2">
            Unlock all features and join our premium community
          </p>
        </div>

        {/* Content - Scrollable for small screens */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-12rem)] scrollbar-hide">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 text-center font-medium">
              <MessageCircleWarning className="inline w-4 h-4 mr-2" />
              You need Premium to{" "}
              <span className="font-bold">{getFeatureMessage()}</span>
            </p>
          </div>

          {/* <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm mb-2 sm:mb-3">
              Premium Features:
            </h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div> */}

          {/* Pricing Info */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-yellow-200 dark:border-yellow-800/30">
            <div className="flex items-baseline justify-center gap-2 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                £3
              </span>
              <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                /month
              </span>
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              or save 20% with yearly plan
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push("/pricing")}
              className="font-semibold py-2.5 sm:py-3 text-sm sm:text-base shadow-lg"
            >
              Upgrade to Premium
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
              className="py-2.5 sm:py-3 text-sm sm:text-base"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-[10px] sm:text-xs text-center text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
            Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline upgrade banner for less intrusive prompts
export const UpgradeBanner = ({ feature, compact = false }) => {
  const router = useRouter();

  const getMessage = () => {
    switch (feature) {
      case "post":
        return "Upgrade to Premium to create posts";
      case "comment":
        return "Upgrade to Premium to add comments";
      case "chat":
        return "Upgrade to Premium to join chat rooms";
      default:
        return "Upgrade to Premium to unlock this feature";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            {getMessage()}
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/pricing")}
          className="font-semibold text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-red-900/10 rounded-xl p-4 sm:p-6 border border-yellow-200 dark:border-yellow-800/30">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 p-2 sm:p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg">
          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
            Premium Feature
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            {getMessage()}. Join thousands of premium members today!
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/pricing")}
            className="font-semibold text-xs sm:text-sm py-2 sm:py-2.5"
          >
            {/* <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> */}
            Upgrade Now - £3/month
          </Button>
        </div>
      </div>
    </div>
  );
};
