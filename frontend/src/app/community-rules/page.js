"use client";

import { Button } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";

export default function TermsAndConditions() {
  const terms = [
    {
      title: "Eligibility & Age Requirement",
      content:
        "You must be at least 13 years old (or the minimum legal age in your country) to use this platform. By creating an account, you confirm that you meet this requirement.",
    },
    {
      title: "Account Responsibility",
      content:
        "You are responsible for maintaining the confidentiality of your account and for all activity that occurs under your account.",
    },
    {
      title: "Acceptable Use",
      content:
        "You agree not to use the platform for unlawful purposes or to post content that is abusive, harassing, hateful, defamatory, or misleading.",
    },
    {
      title: "No Harassment or Abuse",
      content:
        "Harassment, threats, bullying, or targeted abuse of any individual or group is strictly prohibited and may result in suspension or permanent termination.",
    },
    {
      title: "User Content & Rights",
      content:
        "You retain ownership of the content you post but grant the platform a non-exclusive, worldwide license to use, display, and distribute that content.",
    },
    {
      title: "Content Moderation",
      content:
        "We reserve the right to remove content or restrict accounts that violate these terms or disrupt the safety and integrity of the platform.",
    },
    {
      title: "Privacy & Data Use",
      content:
        "Your use of the platform is subject to our Privacy Policy, which explains how we collect, use, and protect your information.",
    },
    {
      title: "Termination & Changes",
      content:
        "We may suspend or terminate access at any time for violations, and we may update these terms with notice. Continued use means acceptance of updated terms.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
            Terms and Conditions
          </h1>

          <div className="space-y-8 sm:space-y-10">
            {terms.map((term, index) => (
              <div key={index} className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {term.title}
                </h2>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                  {term.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Questions About Our Terms?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Our team is here to help clarify any questions about our terms and
            conditions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-gray-900 hover:bg-buttons-gradient border-0"
              onClick={() =>
                window.open(
                  "https://mail.google.com/mail/?view=cm&to=hello@newsnatter.com&su=Support Request",
                  "_blank",
                )
              }
            >
              Contact Support
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
