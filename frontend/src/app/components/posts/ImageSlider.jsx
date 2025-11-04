"use client";

import { useState, useEffect } from "react";

export const ImageSlider = ({ media = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (media.length > 1) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [media.length]);

  // If only one image, just display it normally
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
        {item.type === "image" ? (
          <img
            src={item.url}
            alt="Media"
            className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
          />
        ) : (
          <video
            src={item.url}
            controls
            className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
          />
        )}
      </div>
    );
  }

  const goToPrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const currentItem = media[currentIndex];

  return (
    <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
      {/* Main Image/Video Display */}
      <div className="relative">
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={`Media ${currentIndex + 1} of ${media.length}`}
            className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
          />
        ) : (
          <video
            src={currentItem.url}
            controls
            className="w-full max-h-96 object-contain bg-gray-50 dark:bg-gray-800"
          />
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
              title="Previous (←)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="Next image"
              title="Next (→)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {media.length}
        </div>
      </div>

      {/* Thumbnail Navigation for multiple images */}
      {/* {media.length > 1 && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  index === currentIndex
                    ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50 shadow-lg"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                aria-label={`Go to image ${index + 1}`}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                {index === currentIndex && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};
