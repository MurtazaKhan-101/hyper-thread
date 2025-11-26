"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import UsernameSelection from "@/app/components/onboarding/usernameSelection";
import InterestsSelection from "@/app/components/onboarding/interestsSelection";
import { Spinner, Card } from "@/app/components/ui";
import { ROUTES } from "@/app/lib/constants";
import Link from "next/link";
import Image from "next/image";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!loading && !user) {
      window.location.href = ROUTES.LOGIN;
      return;
    }

    // If already completed onboarding, redirect to dashboard
    if (!loading && user?.onboardingCompleted) {
      window.location.href = ROUTES.DASHBOARD;
      return;
    }

    // Set current step based on user's onboarding progress
    if (user) {
      if (user.onboardingStep === 0 || !user.username) {
        setCurrentStep(0); // Username selection
      } else if (user.onboardingStep === 1) {
        setCurrentStep(1); // Interests selection
      }
    }
  }, [user, loading]);

  const handleUsernameComplete = (updatedUser) => {
    // Update user in context
    updateUser(updatedUser);
    // Move to next step
    setCurrentStep(1);
  };

  const handleInterestsComplete = (updatedUser) => {
    // Update user in context
    updateUser(updatedUser);
    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = ROUTES.DASHBOARD;
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#030303]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href={ROUTES.HOME}>
              <Image
                src="/images/NEWS_NET-V2.svg"
                alt="News Natter Logo"
                width={150}
                height={150}
                className="hidden sm:inline"
              />
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Welcome, {user?.firstName}!</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep === 0
                    ? "bg-buttons-gradient text-white"
                    : currentStep > 0
                    ? "bg-[#46D160] text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {currentStep > 0 ? "✓" : "1"}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep === 0
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Username
              </span>
            </div>

            {/* Connector */}
            <div
              className={`w-16 h-1 transition-colors ${
                currentStep > 0
                  ? "bg-[#46D160]"
                  : "bg-gray-300 dark:bg-gray-700"
              }`}
            />

            {/* Step 2 */}
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep === 1
                    ? "bg-buttons-gradient text-white"
                    : currentStep > 1
                    ? "bg-[#46D160] text-white"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {currentStep > 1 ? "✓" : "2"}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep === 1
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Interests
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="p-8">
          {currentStep === 0 && (
            <UsernameSelection
              onComplete={handleUsernameComplete}
              user={user}
            />
          )}
          {currentStep === 1 && (
            <InterestsSelection onComplete={handleInterestsComplete} />
          )}
        </Card>

        {/* Skip All Button */}
        {currentStep === 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => (window.location.href = ROUTES.DASHBOARD)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Skip onboarding and go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
