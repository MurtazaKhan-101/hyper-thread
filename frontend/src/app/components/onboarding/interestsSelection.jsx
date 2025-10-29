"use client";

import { useState, useEffect } from "react";
import { Button, Alert, Spinner } from "../ui";
import { API_ENDPOINTS } from "@/app/lib/constants";
import apiClient from "@/app/lib/api";

export default function InterestsSelection({ onComplete }) {
  const [interests, setInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch available interests
  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(API_ENDPOINTS.GET_INTERESTS);

      if (data.success) {
        setInterests(data.interests);
      }
    } catch (err) {
      console.error("Error fetching interests:", err);
      setError("Failed to load interests. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (selectedInterests.length < 3) {
      setError("Please select at least 3 interests");
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.post(API_ENDPOINTS.UPDATE_INTERESTS, {
        interests: selectedInterests,
      });

      if (data.success) {
        setSuccess("Interests saved successfully!");
        setTimeout(() => {
          onComplete(data.user);
        }, 500);
      }
    } catch (err) {
      setError(err.message || "Failed to save interests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Complete onboarding without interests
    onComplete({ onboardingCompleted: true });
  };

  if (loading && interests.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What are your interests?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose at least 3 topics to personalize your feed
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Selected: {selectedInterests.length} / {interests.length}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interest Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`
                  px-4 py-3 rounded-md border-2 text-sm font-medium transition-all
                  ${
                    isSelected
                      ? "bg-buttons-gradient border-gray-300 text-white"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400"
                  }
                `}
              >
                {interest}
              </button>
            );
          })}
        </div>

        {/* Error/Success Messages */}
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 flex items-center justify-center"
          >
            Skip for now
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedInterests.length < 3}
            className="flex-1 flex items-center justify-center"
          >
            {loading ? <Spinner size="sm" /> : "Continue to Dashboard"}
          </Button>
        </div>

        {/* Helper text */}
        {selectedInterests.length < 3 && (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Select at least {3 - selectedInterests.length} more interest
            {3 - selectedInterests.length !== 1 ? "s" : ""} to continue
          </p>
        )}
      </form>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          💡 Why choose interests?
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Get personalized content recommendations</li>
          <li>• Discover communities that match your passions</li>
          <li>• Connect with like-minded users</li>
          <li>• You can always update these later in settings</li>
        </ul>
      </div>
    </div>
  );
}
