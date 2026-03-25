"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import {
  Calendar,
  Crown,
  AlertCircle,
  Loader2,
  User,
  Lock,
  Bell,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button, ConfirmationModal } from "../components/ui";
import apiClient from "../lib/api";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Profile management state
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login?redirect=/settings");
      return;
    }

    // Initialize profile data from user
    setProfileData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      bio: user.bio || "",
    });

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

  const handleReactivateSubscription = async () => {
    try {
      setReactivating(true);

      const loadingToast = toast.loading("Reactivating subscription...", {
        style: {
          background: "#667eea",
          color: "#fff",
        },
      });

      await apiClient.request("/stripe/reactivate-subscription", {
        method: "POST",
      });

      toast.dismiss(loadingToast);
      toast.success(
        "Subscription reactivated successfully! Your premium access will continue.",
        {
          duration: 5000,
          style: {
            background: "#10b981",
            color: "#fff",
          },
        }
      );

      // Refresh subscription data
      await fetchSubscriptionStatus();
      await refreshUser();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      toast.error(error.message || "Failed to reactivate subscription", {
        duration: 4000,
        style: {
          background: "#ef4444",
          color: "#fff",
        },
      });
    } finally {
      setReactivating(false);
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

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));

    // Reset username availability check when username changes
    if (field === "username") {
      setUsernameAvailable(null);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      toast.loading("Uploading profile image...");

      // Step 1: Get presigned URL
      const urlData = await apiClient.request(
        "/user/profile/image/upload-url",
        {
          method: "POST",
          body: JSON.stringify({ fileType: file.type }),
        }
      );

      // Step 2: Upload to R2 using presigned URL
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Step 3: Update profile with new image URL
      await apiClient.request("/user/profile/image", {
        method: "PUT",
        body: JSON.stringify({ profileImage: urlData.publicUrl }),
      });

      toast.dismiss();
      toast.success("Profile image updated successfully!");
      await refreshUser();
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to upload profile image");
    } finally {
      setUploadingImage(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username === user.username) {
      setUsernameAvailable(null);
      return;
    }

    try {
      setCheckingUsername(true);
      const data = await apiClient.request(`/user/check-username/${username}`);
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameBlur = () => {
    if (
      profileData.username &&
      profileData.username !== user.username &&
      profileData.username.length >= 3
    ) {
      checkUsernameAvailability(profileData.username);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      // Validate required fields
      if (!profileData.firstName.trim() || !profileData.lastName.trim()) {
        toast.error("First name and last name are required");
        return;
      }

      const data = await apiClient.request("/user/profile", {
        method: "PUT",
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          username: profileData.username,
          bio: profileData.bio,
          interests: profileData.interests,
        }),
      });

      toast.success("Profile updated successfully!");
      await refreshUser();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      // Validate passwords
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        toast.error("All password fields are required");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        toast.error("New password must be at least 8 characters long");
        return;
      }

      setChangingPassword(true);

      await apiClient.request("/user/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      toast.success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);

      await apiClient.request("/user/account", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      toast.success("Account deleted successfully");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
      setDeletingAccount(false);
    }
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
            Manage your account, profile, and subscription preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "profile"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "password"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Account
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`pb-4 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "subscription"
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              Subscription
            </button>
            <button
              onClick={() => router.push("/settings/notifications")}
              className="pb-4 px-2 text-sm font-medium border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-6 h-6" />
                Profile Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <Image
                    src={user.profileImage}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profileImageInput"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleProfileImageChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <label
                      htmlFor="profileImageInput"
                      className={`inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploadingImage ? "Uploading..." : "Choose Image"}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      JPEG, PNG, GIF, or WebP. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) =>
                      handleProfileChange("firstName", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) =>
                      handleProfileChange("lastName", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) =>
                      handleProfileChange("username", e.target.value)
                    }
                    onBlur={handleUsernameBlur}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Enter your username"
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-3">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!checkingUsername &&
                    usernameAvailable !== null &&
                    profileData.username !== user.username && (
                      <div className="absolute right-3 top-3">
                        {usernameAvailable ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    )}
                </div>
                {usernameAvailable === false &&
                  profileData.username !== user.username && (
                    <p className="text-sm text-red-500 mt-1">
                      Username is already taken
                    </p>
                  )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  3-20 characters, letters, numbers, underscores, and hyphens
                  only
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 dark:text-white resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {profileData.bio.length}/500 characters
                </p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={handleSaveProfile}
                  disabled={
                    savingProfile ||
                    (usernameAvailable === false &&
                      profileData.username !== user.username)
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-black hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {savingProfile ? <>Saving...</> : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "password" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Account
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {!(user.googleId && !user.password) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Enter your new password"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Delete Account Section */}
              <div className="mt-8 pt-8 border-t-2 border-red-200 dark:border-red-900">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 text-black hover:bg-red-700 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
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
                              <span className="font-medium">
                                Billing Cycle:
                              </span>
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
                                        Your subscription will automatically
                                        renew on{" "}
                                        {formatDate(user.premiumExpiresAt)}.
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
                        {managingBilling ? (
                          <>Opening...</>
                        ) : (
                          <>Manage Billing</>
                        )}
                      </Button>

                      {subscriptionData?.subscription?.cancelAtPeriodEnd ||
                      subscriptionData?.subscription?.cancelAt ? (
                        <Button
                          onClick={handleReactivateSubscription}
                          disabled={reactivating}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-black hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          {reactivating ? (
                            <>Reactivating...</>
                          ) : (
                            <>Reactivate Subscription</>
                          )}
                        </Button>
                      ) : (
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
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword("");
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        confirmText="Delete My Account"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
        isLoading={deletingAccount}
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete your account? This will permanently
            delete:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Your profile and all personal information</li>
            <li>All your posts and comments</li>
            <li>Your subscription (if active)</li>
            <li>All saved preferences and settings</li>
          </ul>
          <p className="text-red-600 dark:text-red-400 font-semibold">
            This action cannot be undone.
          </p>
          {user.password && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>
          )}
        </div>
      </ConfirmationModal>

      {/* Subscription Cancellation Modal */}
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
