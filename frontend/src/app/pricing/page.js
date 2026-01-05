"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Check } from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import apiClient from "../lib/api";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null); // 'monthly' or 'yearly'

  const features = [
    "Create unlimited posts",
    "Comment on any discussion",
    "Join live chat rooms",
    "Get priority support",
  ];

  const monthlyPrice = 3;
  const yearlyPrice = 28.8; // £2.40/month when billed yearly (£28.80/year)
  const yearlyTotal = 28.8;
  const savingsPercent = 20;

  const handleSubscribe = async (planType) => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please login to subscribe to premium");
      setTimeout(() => {
        router.push("/auth/login?redirect=/pricing");
      }, 1000);
      return;
    }

    setLoadingPlan(planType);

    try {
      const priceId =
        planType === "monthly"
          ? "price_1SdlDwFpevkwZF4j2ia47jva" // Your monthly price ID
          : "price_1SdlFjFpevkwZF4jbxtQMFkc"; // Your yearly price ID

      toast.loading("Redirecting to checkout...");

      // Call backend to create checkout session using apiClient
      const data = await apiClient.request("/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          priceId,
          planType,
        }),
      });

      // Redirect directly to the Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.dismiss();
      toast.error(
        error.message || "Failed to start checkout. Please try again."
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Unlock all features and join our premium community
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300 relative">
            {/* Current Plan Badge */}
            {user?.isPremium && user?.premiumExpiresAt && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  CURRENT PLAN
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Monthly Plan
              </h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  £{monthlyPrice}
                </span>
                <span className="text-xl text-gray-600 dark:text-gray-400">
                  /month
                </span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleSubscribe("monthly")}
              disabled={loadingPlan !== null || user?.isPremium}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-black font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user?.isPremium ? (
                "Current Plan"
              ) : loadingPlan === "monthly" ? (
                <>Processing...</>
              ) : (
                "Upgrade Monthly"
              )}
            </Button>
          </div>

          {/* Yearly Plan */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-yellow-400 dark:border-yellow-500 transform md:scale-105">
            {/* Save Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full px-8">
              <div className="bg-gradient-to-r from-pink-400 to-pink-500 text-white text-center py-2 rounded-full font-bold text-sm shadow-lg">
                SAVE {savingsPercent}%
              </div>
            </div>

            <div className="text-center mb-8 mt-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Yearly Plan
              </h2>
              <div className="mb-2">
                <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                  £{monthlyPrice}
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  £{(yearlyPrice / 12).toFixed(2)}
                </span>
                <span className="text-xl text-gray-600 dark:text-gray-400">
                  /month
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Billed yearly as £{yearlyTotal.toFixed(2)}
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleSubscribe("yearly")}
              disabled={loadingPlan !== null || user?.isPremium}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-black font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user?.isPremium ? (
                "Already Premium"
              ) : loadingPlan === "yearly" ? (
                <>Processing...</>
              ) : (
                "Upgrade Yearly"
              )}
            </Button>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 dark:text-gray-400 mt-12 text-sm">
          Cancel anytime. No hidden fees.
        </p>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
