"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Crown, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export default function PricingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Refresh user data to get updated premium status
    const refreshUserData = async () => {
      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refresh user data from AuthContext
        if (refreshUser) {
          await refreshUser();
        }

        setLoading(false);
      } catch (err) {
        console.error("Error refreshing user data:", err);
        setError("Could not verify subscription");
        setLoading(false);
      }
    };

    refreshUserData();
  }, [sessionId, refreshUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 px-4">
            Verifying your subscription...
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
            Please wait while we activate your premium features
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl sm:text-4xl">⚠️</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verification Issue
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push("/dashboard")}
            className="py-2.5 sm:py-3"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-4 bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12">
        {/* Success Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-3 sm:mb-4 animate-bounce">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-3 sm:mb-4" />

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 px-2">
            Welcome to Premium!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 px-2">
            Your subscription is now active
          </p>
        </div>

        {/* Premium Features */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-yellow-200 dark:border-yellow-800/30">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-center text-sm sm:text-base">
            You now have access to:
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              "Create unlimited posts",
              "Comment on any discussion",
              "Join live chat rooms",
              "Get priority support",
              "No ads experience",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Expiry Info */}
        {user?.premiumExpiresAt && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 border border-blue-200 dark:border-blue-800">
            <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 text-center">
              Your premium subscription will automatically renew on{" "}
              <span className="font-bold">
                {new Date(user.premiumExpiresAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-2.5 sm:py-3 text-base sm:text-lg"
          >
            Start Exploring
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => router.push("/create-post")}
            className="py-2.5 sm:py-3 text-sm sm:text-base"
          >
            Create Your First Post
          </Button>
        </div>

        <p className="text-[10px] sm:text-xs text-center text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 px-2">
          You can manage your subscription anytime from Settings
        </p>
      </div>
    </div>
  );
}
