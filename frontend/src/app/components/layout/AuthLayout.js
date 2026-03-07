"use client";

import { Card } from "../ui";
import Link from "next/link";
import Image from "next/image";

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        backgroundImage: "url(/images/sidebar-bg-v4.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f9fafb",
      }}
    >
      <div className="w-full max-w-md">
        {/* Reddit-style logo/branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/NEWS_NET-V2.svg"
              alt="newsnatter Logo"
              width={150}
              height={150}
              className="hidden sm:inline"
            />
          </Link>
        </div>

        {/* Auth Card */}
        <Card className="p-8">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-black">
            By continuing, you agree to our User Agreement and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
