"use client";

import { Button } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function AboutUs() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-10">
            About.
          </h1>

          <div className="space-y-6 sm:space-y-8 text-gray-900 dark:text-white">
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold leading-relaxed">
              Newsnatter is where stories spark conversation.
            </p>

            <p className="text-base sm:text-lg lg:text-xl leading-relaxed">
              We're a platform for sharing news, trending stories, and viral
              moments — and having real, focused discussions about them.
            </p>

            <p className="text-base sm:text-lg lg:text-xl leading-relaxed">
              Every post becomes a hub for debate, context, and updates, so you
              can follow the story, not the chaos.
            </p>

            <p className="text-base sm:text-lg lg:text-xl leading-relaxed">
              Whether it's breaking news, a viral clip, or a trending topic,
              Newsnatter gives you the space to see multiple perspectives, share
              your take, and discuss what's happening — all in one place.
            </p>

            <p className="text-xl sm:text-2xl font-semibold text-buttons-gradient mt-8 sm:mt-10">
              Join the conversation.
            </p>
          </div>
        </div>

        {/* CTA Section with gradient background */}
        {/* <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Join our community today and be part of something meaningful.
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Connect with like-minded individuals, share your passions, and
            discover new perspectives in a space designed for authentic human
            connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <Link href={ROUTES.EXPLORE}>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-gray-900 hover:bg-buttons-gradient border-0"
                >
                  Explore Trending
                </Button>
              </Link>
            ) : (
              <Link href={ROUTES.SIGNUP}>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-gray-900 hover:bg-buttons-gradient border-0"
                >
                  Explore Trending
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Link href={ROUTES.DASHBOARD} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
                >
                  Get Started
                </Button>
              </Link>
            ) : (
              <Link href={ROUTES.SIGNUP} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
                >
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div> */}
      </main>
    </div>
  );
}
