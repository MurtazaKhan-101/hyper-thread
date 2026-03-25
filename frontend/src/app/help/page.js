"use client";

import { Button, Card } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";
import { useState } from "react";

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer:
        "To create an account, click on the 'Sign Up' button and fill in your email, password, and basic information. You'll receive a verification email to confirm your account.",
    },
    {
      question: "I forgot my password, what should I do?",
      answer:
        "Click on 'Forgot Password' on the login page. Enter your email address and we'll send you a reset link. Follow the instructions in the email to create a new password.",
    },
    {
      question: "Can I change my username or profile picture?",
      answer:
        "Yes! Go to your profile settings from the dashboard. You can update your username, profile picture, bio, and other personal information anytime.",
    },
    {
      question: "Why am I not seeing my recent post?",
      answer:
        "Posts may take a few moments to appear in the feed. If your post still doesn't show up after refreshing, please check if it meets our community guidelines or contact support.",
    },
    {
      question: "How do I report inappropriate content?",
      answer:
        "Click the three dots menu on any post and select 'Report'. Choose the appropriate reason and we'll review the content within 24 hours.",
    },
    {
      question: "Can I delete my posts?",
      answer:
        "Yes, you can delete your own posts by clicking the three dots menu on your post and selecting 'Delete'. Note that this action cannot be undone.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-buttons-gradient mb-4 sm:mb-6">
            Help
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            We&apos;re here to make your experience smooth and enjoyable.
            Explore our FAQs, find troubleshooting steps, or reach out directly
            if you need extra assistance.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-buttons-gradient mb-6 sm:mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-buttons-gradient p-[2px] rounded-lg"
              >
                <Card className="overflow-hidden bg-white dark:bg-gray-900 rounded-lg">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 pr-4">
                      {faq.question}
                    </span>
                    <span className="text-buttons-gradient text-xl sm:text-2xl font-bold flex-shrink-0">
                      {openFAQ === index ? "−" : "+"}
                    </span>
                  </button>

                  {openFAQ === index && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 border-t border-gray-500 dark:border-gray-700">
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed pt-4">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Need Help */}
        <div className="mb-12 sm:mb-16">
          <div className="bg-buttons-gradient p-[2px] rounded-lg">
            <Card className="bg-white dark:bg-gray-900 rounded-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-buttons-gradient mb-2">
                Need help?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Email us at{" "}
                <a
                  href="mailto:hello@newsnatter.com"
                  className="text-buttons-gradient font-semibold underline underline-offset-4"
                >
                  hello@newsnatter.com
                </a>
                {" "}and we’ll get back to you as soon as possible.
              </p>
            </Card>
          </div>
        </div>

        {/* Need More Help CTA */}
        {/* <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Need more Help?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Can&apos;t find what you&apos;re looking for? Our friendly support
            team is just one click away.
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
        </div> */}
      </main>
    </div>
  );
}
