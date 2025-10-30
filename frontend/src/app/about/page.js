"use client";

import { Button, Card } from "../components/ui";
import Link from "next/link";
import { ROUTES } from "../lib/constants";
import Image from "next/image";
export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303]">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-buttons-gradient mb-4 sm:mb-6">
            About Us
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Building a connected space where people share ideas, moments, and
            meaningful conversations.
          </p>
        </div>

        {/* Story Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Story Text */}
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-buttons-gradient mb-4 sm:mb-6">
                Our Story
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                We started with a simple goal to make online communities more
                open, expressive, and human. This platform allows users to share
                thoughts, images, and ideas freely, while encouraging genuine
                interaction.
              </p>
            </div>

            {/* Story Illustration */}
            <div className="order-1 lg:order-2 flex justify-center">
              <div className="relative w-64 h-48 sm:w-80 sm:h-60">
                <Image
                  src="/images/communication.svg"
                  alt="Communication Illustration"
                  className="w-full h-full object-contain"
                  height={250}
                  width={250}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16 lg:mb-20">
          {/* Mission */}
          <Card className="p-6 sm:p-8 lg:p-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-buttons-gradient mb-4 sm:mb-6">
              Our Mission
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              To connect people through authentic stories, diverse topics, and
              shared experiences.
            </p>
          </Card>

          {/* Vision */}
          <Card className="p-6 sm:p-8 lg:p-10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-buttons-gradient mb-4 sm:mb-6">
              Our Vision
            </h3>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              A world where social media encourages learning, empathy, and
              creativity, not just scrolling.
            </p>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-buttons-gradient text-center mb-8 sm:mb-12">
            What Makes Us Different
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="mb-4 sm:mb-6">
                <Image
                  src="/images/shake-hand.svg"
                  alt="Handshake Icon"
                  className="w-24 h-24  object-contain mx-auto"
                  width={500}
                  height={500}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-buttons-gradient mb-3 sm:mb-4">
                Authentic Community
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Real conversations with real people, fostering genuine
                connections and meaningful discussions.
              </p>
            </Card>

            <Card className="p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="mb-4 sm:mb-6">
                <Image
                  src="/images/creativity.svg"
                  alt="Handshake Icon"
                  className="w-24 h-24  object-contain mx-auto"
                  width={500}
                  height={500}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-buttons-gradient mb-3 sm:mb-4">
                Creative Expression
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Share your thoughts, images, and ideas in a space that
                celebrates creativity and diversity.
              </p>
            </Card>

            <Card className="p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
              <div className="mb-4 sm:mb-6">
                <Image
                  src="/images/user-experience.svg"
                  alt="Handshake Icon"
                  className="w-24 h-24  object-contain mx-auto"
                  width={500}
                  height={500}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-buttons-gradient mb-3 sm:mb-4">
                Modern Experience
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Built with cutting-edge technology for a fast, responsive, and
                delightful user experience.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section with gradient background */}
        <div className="bg-ui-cards-gradient rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center text-white">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Join our community today and be part of something meaningful.
          </h2>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
            Connect with like-minded individuals, share your passions, and
            discover new perspectives in a space designed for authentic human
            connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={ROUTES.SIGNUP}>
              <Button
                variant="secondary"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-white text-gray-900 hover:bg-buttons-gradient border-0"
              >
                Explore Trending
              </Button>
            </Link>
            <Link href={ROUTES.SIGNUP} className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
