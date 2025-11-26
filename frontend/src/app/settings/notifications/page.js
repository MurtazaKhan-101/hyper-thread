"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { userPreferencesService } from "../../lib/engagement";
import { useRouter } from "next/navigation";
import { Spinner, Button } from "../../components/ui";
import { Bell, Mail, Calendar, Check } from "lucide-react";

export default function NotificationSettingsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    digestFrequency: "weekly",
    categories: [],
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  const fetchPreferences = async () => {
    try {
      const response =
        await userPreferencesService.getNotificationPreferences();
      setPreferences(
        response.preferences || {
          emailNotifications: true,
          digestFrequency: "weekly",
          categories: [],
        }
      );
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await userPreferencesService.updateNotificationPreferences(preferences);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const availableCategories = [
    "sports",
    "culture",
    "internet",
    "history",
    "entertainment",
    "technology",
    "science",
    "politics",
    "business",
    "health",
  ];

  const toggleCategory = (category) => {
    setPreferences((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Notification Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your email notification preferences
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
          {/* Email Notifications Toggle */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Receive email notifications about your posts, comments, and
                  trending content
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setPreferences((prev) => ({
                  ...prev,
                  emailNotifications: !prev.emailNotifications,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                preferences.emailNotifications
                  ? "bg-blue-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailNotifications
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Digest Frequency */}
          {preferences.emailNotifications && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Digest Frequency
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How often would you like to receive digest emails?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 ml-14">
                {[
                  {
                    value: "daily",
                    label: "Daily",
                    desc: "Every morning at 9 AM",
                  },
                  {
                    value: "weekly",
                    label: "Weekly",
                    desc: "Every Monday at 9 AM",
                  },
                  { value: "never", label: "Never", desc: "No digest emails" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        digestFrequency: option.value,
                      }))
                    }
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      preferences.digestFrequency === option.value
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      {preferences.digestFrequency === option.value && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {option.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Preferences */}
          {preferences.emailNotifications &&
            preferences.digestFrequency !== "never" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Bell className="w-5 h-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Category Preferences
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose categories to receive notifications about
                      <span className="text-gray-500 dark:text-gray-500 ml-1">
                        (Leave empty for all categories)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 ml-14">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        preferences.categories.includes(category)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Save Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              {saveSuccess && (
                <span className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  Settings saved successfully!
                </span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? <Spinner size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            About Email Notifications
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • Instant notifications for comments and replies on your posts
            </li>
            <li>
              • Digest emails with top trending posts based on your preferences
            </li>
            <li>• Unsubscribe anytime from the link in any email</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
