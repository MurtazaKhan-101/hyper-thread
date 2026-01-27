"use client";

import { Button } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";

export default function PrivacyPolicy() {
  const sections = [
    {
      number: "1.",
      title: "Information Collection",
      content:
        "We collect information you provide (such as account details and posts) and information automatically collected (such as device data, IP address, and usage activity).",
    },
    {
      number: "2.",
      title: "Use of Information",
      content:
        "Your information is used to operate, improve, secure the platform, personalize content, and comply with legal obligations.",
    },
    {
      number: "3.",
      title: "Sharing & Disclosure",
      content:
        "We do not sell personal information. Data may be shared with trusted service providers or disclosed when required by law.",
    },
    {
      number: "4.",
      title: "Your Rights & Security",
      content:
        "You may access, update, or delete your information through your account. We use reasonable safeguards to protect your data, though no system is completely secure.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-8 sm:mb-12">
            Privacy Policy
          </h1>

          <div className="space-y-8 sm:space-y-10">
            {sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {section.number} {section.title}
                </h2>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed pl-6">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Questions About Privacy?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Our team is here to help answer any questions about how we protect
            your data and respect your privacy.
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
              onClick={() =>
                window.open(
                  "https://mail.google.com/mail/?view=cm&to=hello@newsnatter.com&su=Privacy Inquiry",
                  "_blank"
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
