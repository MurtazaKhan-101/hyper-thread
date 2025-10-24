"use client";

import { useState, useEffect } from "react";
import { Button, Input, Alert, Spinner } from "../ui";
import { API_ENDPOINTS } from "@/app/lib/constants";
import apiClient from "@/app/lib/api";

export default function UsernameSelection({ onComplete, user }) {
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availability, setAvailability] = useState(null);

  // Generate suggestions on mount
  useEffect(() => {
    if (user?.firstName && user?.lastName) {
      generateSuggestions();
    }
  }, [user]);

  // Check username availability on change (debounced)
  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailability(null);
      setError("");
      return;
    }

    // Validate username format before checking availability
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setAvailability(null);
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      return;
    }

    // Clear error if format is valid
    setError("");

    const timer = setTimeout(() => {
      checkAvailability(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.post(API_ENDPOINTS.GENERATE_USERNAME, {
        firstName: user.firstName,
        lastName: user.lastName,
      });

      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async (usernameToCheck) => {
    try {
      setChecking(true);
      setAvailability(null);

      const data = await apiClient.post(API_ENDPOINTS.CHECK_USERNAME, {
        username: usernameToCheck,
      });

      if (data.success) {
        setAvailability(data.available);
      }
    } catch (err) {
      console.error("Error checking username:", err);
      // Don't show error for validation failures
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    if (!username) {
      setError("Please enter a username");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      return;
    }

    if (availability === false) {
      setError("Username is already taken");
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.post(API_ENDPOINTS.UPDATE_USERNAME, {
        username,
      });

      if (data.success) {
        setSuccess("Username set successfully!");
        setTimeout(() => {
          onComplete(data.user);
        }, 500);
      }
    } catch (err) {
      setError(err.message || "Failed to set username. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setUsername(suggestion);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Choose your username
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This is how other users will identify you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Input */}
        <div>
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="Enter username"
            error={error && !success ? error : ""}
            disabled={loading}
            autoComplete="off"
          />

          {/* Availability indicator */}
          {username.length >= 3 && !error && (
            <div className="mt-2 flex items-center text-sm">
              {checking ? (
                <span className="text-gray-500 dark:text-gray-400">
                  Checking availability...
                </span>
              ) : availability === true ? (
                <span className="text-green-600 dark:text-green-400 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Username is available
                </span>
              ) : availability === false ? (
                <span className="text-red-600 dark:text-red-400 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Username is already taken
                </span>
              ) : null}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && !username && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Suggestions based on your name:
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {success && <Alert type="success">{success}</Alert>}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !username || availability === false}
          className="w-full flex items-center justify-center"
        >
          {loading ? <Spinner size="sm" /> : "Continue"}
        </Button>
      </form>

      {/* Username rules */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Username rules:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• 3-20 characters long</li>
          <li>• Letters, numbers, underscores, and hyphens only</li>
          <li>• No spaces allowed</li>
          <li>• Must be unique</li>
        </ul>
      </div>
    </div>
  );
}
