"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { Button, Card } from "./components/ui";
import { ROUTES } from "./lib/constants";
import Link from "next/link";
import Image from "next/image";
import { Shield, Zap, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [mounted, loading, isAuthenticated, router]);

  if (!mounted || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Image
              src="/images/NEWS_NET-V2.svg"
              alt="News Natter Logo"
              width={150}
              height={150}
              className="hidden sm:inline"
            />

            <div className="flex items-center gap-3">
              <Link href={ROUTES.LOGIN}>
                <Button variant="outline">Log In</Button>
              </Link>
              <Link href={ROUTES.SIGNUP}>
                <Button variant="primary">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to News Natter
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Connect with communities and share what matters to you
          </p>
          <div className="flex justify-center gap-4">
            <Link href={ROUTES.SIGNUP}>
              <Button variant="primary" className="px-8 py-3 text-base">
                Get Started
              </Button>
            </Link>
            <Link href={ROUTES.LOGIN}>
              <Button variant="secondary" className="px-8 py-3 text-base">
                Log In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Secure Authentication
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multiple sign-in options with email verification and social login
              for seamless access
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Zap className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Lightning Fast
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instant page loads and smooth interactions for an exceptional user
              experience
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              Clean Design
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Elegant minimal interface with customizable dark mode for
              comfortable browsing
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Ready to dive in?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of users already connected on News Natter
          </p>
          <Link href={ROUTES.SIGNUP}>
            <Button variant="primary" className="px-12 py-3 text-base">
              Create Account
            </Button>
          </Link>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2025 News Natter. All rights reserved.</p>
            <p className="mt-2">
              By using News Natter, you agree to our User Agreement and Privacy
              Policy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
