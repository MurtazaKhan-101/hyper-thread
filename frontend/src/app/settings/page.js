"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Calendar, Crown, AlertCircle, Loader2 } from "lucide-react";
import { Button, ConfirmationModal } from "../components/ui";
import apiClient from "../lib/api";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/settings");
      return;
    }

    fetchSubscriptionStatus();

    // Refresh subscription data when user returns from Stripe Portal
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log(
          "User returned to settings page, refreshing subscription..."
        );
        fetchSubscriptionStatus();
        refreshUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request("/stripe/subscription-status");
      setSubscriptionData(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      toast.error("Failed to load subscription details", {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setManagingBilling(true);

      const loadingToast = toast.loading("Opening billing portal...", {
        style: {
          background: "#6366f1",
          color: "#fff",
        },
      });

      const data = await apiClient.request("/stripe/create-portal-session", {
        method: "POST",
      });

      toast.dismiss(loadingToast);
      toast.success("Redirecting to Stripe...", {
        duration: 2000,
        style: {
          background: "#10b981",
          color: "#fff",
        },
      });

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error(error.message || "Failed to open billing portal", {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setManagingBilling(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);

      const loadingToast = toast.loading("Cancelling subscription...", {
        style: {
          background: "#f59e0b",
          color: "#fff",
        },
      });

      await apiClient.request("/stripe/cancel-subscription", {
        method: "POST",
      });

      toast.dismiss(loadingToast);
      toast.success(
        "Subscription cancelled successfully! You'll have access until the end of your billing period.",
        {
          duration: 5000,
          style: {
            background: "#10b981",
            color: "#fff",
          },
        }
      );

      setShowCancelModal(false);

      // Refresh subscription data
      await fetchSubscriptionStatus();
      await refreshUser();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error(error.message || "Failed to cancel subscription", {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account and subscription preferences
          </p>
        </div>

        {/* Subscription Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-sidebar-gradient px-6 py-4">
            <h2 className="text-xl font-bold text-black flex items-center gap-2">
              <Crown className="w-6 h-6" />
              Subscription Management
            </h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current Plan Status */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`px-4 py-2 rounded-full font-semibold text-sm ${
                            user.isPremium
                              ? "bg-sidebar-gradient text-black"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {user.isPremium ? "Premium Plan" : "Free Plan"}
                        </div>

                        {(subscriptionData?.subscription?.cancelAtPeriodEnd ||
                          subscriptionData?.subscription?.cancelAt) && (
                          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Cancels on{" "}
                            {formatDate(
                              subscriptionData.subscription.cancelAt ||
                                subscriptionData.subscription.currentPeriodEnd
                            )}
                          </div>
                        )}
                      </div>

                      {user.isPremium ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium">Billing Cycle:</span>
                            <span className="capitalize">
                              {subscriptionData?.subscription?.planInterval ||
                                "N/A"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium">Expires On:</span>
                            <span>{formatDate(user.premiumExpiresAt)}</span>
                          </div>

                          {user.premiumExpiresAt && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <AlertCircle className="w-5 h-5" />
                                <div>
                                  <span className="font-semibold">
                                    {getDaysRemaining(user.premiumExpiresAt)}{" "}
                                    days remaining
                                  </span>
                                  {subscriptionData?.subscription
                                    ?.cancelAtPeriodEnd ||
                                  subscriptionData?.subscription?.cancelAt ? (
                                    <p className="text-sm mt-1">
                                      Your subscription will end on{" "}
                                      {formatDate(
                                        subscriptionData.subscription
                                          .cancelAt || user.premiumExpiresAt
                                      )}
                                      . You won't be charged again.
                                    </p>
                                  ) : (
                                    <p className="text-sm mt-1">
                                      Your subscription will automatically renew
                                      on {formatDate(user.premiumExpiresAt)}.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                              Premium Features
                            </h4>
                            <ul className="space-y-2">
                              {[
                                "Create unlimited posts",
                                "Comment on any discussion",
                                "Join live chat rooms",
                                "Priority support",
                                "No ads experience",
                              ].map((feature, index) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm"
                                >
                                  <div className="w-1.5 h-1.5 bg-purple-600 dark:bg-purple-400 rounded-full" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            You're currently on the free plan. Upgrade to
                            premium to unlock all features!
                          </p>
                          <Button
                            onClick={() => router.push("/pricing")}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-black hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            Upgrade to Premium
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {user.isPremium && subscriptionData?.hasStripeCustomer && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleManageBilling}
                      disabled={managingBilling}
                      className="flex-1 bg-gray-900 dark:bg-gray-600 text-black hover:bg-gray-800 dark:hover:bg-gray-500 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {managingBilling ? <>Opening...</> : <>Manage Billing</>}
                    </Button>

                    {!(
                      subscriptionData?.subscription?.cancelAtPeriodEnd ||
                      subscriptionData?.subscription?.cancelAt
                    ) && (
                      <Button
                        onClick={() => setShowCancelModal(true)}
                        disabled={cancelling}
                        className="flex-1 bg-red-600 dark:bg-red-600 text-black hover:bg-red-700 dark:hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You'll continue to have premium access until the end of your billing period, and you won't be charged again."
        confirmText="Yes, Cancel Subscription"
        cancelText="Keep Subscription"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        isLoading={cancelling}
      />
    </div>
  );
}
