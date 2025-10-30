"use client";

import { Button, Card } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";
import Image from "next/image";
export default function CommunityRules() {
  const rules = [
    {
      title: "1. Respect Others",
      description: "Treat everyone with courtesy and respect.",
      points: [
        "Harassment, hate speech, bullying, or discrimination of any kind will not be tolerated.",
        "Disagreements are fine, personal attacks are not.",
      ],
    },
    {
      title: "2. Post Responsibly",
      description: "You are responsible for the content you share.",
      points: [
        "Avoid posting threatening, harmful, or explicit material.",
        "Do not share private or confidential information without consent.",
        "Credit creators when sharing their work or content.",
      ],
    },
    {
      title: "3. No Spam or Misuse",
      description: "Keep the platform authentic and useful.",
      points: [
        "Don't post repetitive, irrelevant, or promotional spam.",
        "Avoid bots or scripts that artificially boost engagement.",
        "Use the platform for genuine interaction, not manipulation.",
      ],
    },
    {
      title: "4. Follow Legal Guidelines",
      description: "All content must comply with applicable laws.",
      points: [
        "No copyright infringement or stolen content.",
        "Respect intellectual property rights.",
        "Report illegal content immediately.",
      ],
    },
    {
      title: "5. Keep It Safe",
      description: "Help us maintain a secure environment.",
      points: [
        "Don't share malicious links or harmful downloads.",
        "Protect your personal information and respect others' privacy.",
        "Report suspicious activity to our moderation team.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
            <Image
              src="/images/justice-svgrepo.svg"
              alt="Community Rules"
              width={50}
              height={50}
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-buttons-gradient">
              Community Rules & Guidelines
            </h1>
          </div>

          <div className="text-left max-w-3xl mx-auto mb-6 sm:mb-8">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 italic mb-4">
              <strong>Last Updated:</strong> October 2025
            </p>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to our community! We&apos;ve built this platform to
              connect people, share ideas, and inspire creativity, while
              maintaining respect, kindness, and safety for everyone. These
              rules help ensure a positive experience for all users.
            </p>
          </div>
        </div>

        {/* Rules Section */}
        <div className="mb-12 sm:mb-16">
          <div className="space-y-6 sm:space-y-8">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="bg-buttons-gradient p-[2px] rounded-xl"
              >
                <Card className="bg-white dark:bg-gray-900 rounded-xl p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-buttons-gradient mb-3 sm:mb-4">
                    {rule.title}
                  </h2>
                  <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-medium mb-4 sm:mb-6">
                    {rule.description}
                  </p>
                  <ul className="space-y-2 sm:space-y-3">
                    {rule.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-3">
                        <span className="text-buttons-gradient text-lg font-bold mt-1 flex-shrink-0">
                          •
                        </span>
                        <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Consequences Section */}
        <div className="mb-12 sm:mb-16">
          <Card className="p-6 sm:p-8 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <span className="text-2xl sm:text-3xl">⚠️</span>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-buttons-gradient mb-3 sm:mb-4">
                  Violation Consequences
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Violations of these guidelines may result in:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-buttons-gradient text-lg font-bold mt-1">
                      •
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Content removal or editing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-buttons-gradient text-lg font-bold mt-1">
                      •
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Temporary or permanent account suspension
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-buttons-gradient text-lg font-bold mt-1">
                      •
                    </span>
                    <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      Reporting to appropriate authorities for illegal content
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Reporting Section */}
        <div className="mb-12 sm:mb-16">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {/* How to Report */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-2xl sm:text-3xl">🚨</span>
                <h3 className="text-xl sm:text-2xl font-bold text-buttons-gradient">
                  How to Report
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                If you see content that violates these guidelines:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    1.
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Click the three dots menu on the post
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    2.
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Select &quot;Report Content&quot;
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    3.
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Choose the appropriate reason
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    4.
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Our team will review within 24 hours
                  </span>
                </li>
              </ul>
            </Card>

            {/* Appeals Process */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-2xl sm:text-3xl">⚖️</span>
                <h3 className="text-xl sm:text-2xl font-bold text-buttons-gradient">
                  Appeals Process
                </h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                If you believe your content was removed in error:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    •
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Email us with your appeal
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    •
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Include your username and post details
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    •
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Explain why you believe it was an error
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-buttons-gradient text-lg font-bold mt-1">
                    •
                  </span>
                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    We&apos;ll respond within 48 hours
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center text-white mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Questions About Our Guidelines?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Our community team is here to help clarify any questions about our
            rules and ensure everyone has a positive experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Link href={ROUTES.HELP}>
              <Button
                variant="secondary"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 border-0"
              >
                Visit Help Center
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
            >
              Contact Support
            </Button>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <Card className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-2xl">🤝</span>
              <h3 className="text-xl sm:text-2xl font-bold text-buttons-gradient">
                Building Together
              </h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              These guidelines evolve with our community. We welcome feedback
              and suggestions to make our platform better for everyone. Thank
              you for helping us create a respectful, creative, and inclusive
              space!
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
