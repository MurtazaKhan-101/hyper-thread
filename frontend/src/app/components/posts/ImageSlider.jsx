"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const ImageSlider = ({ media = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  // If only one image, just display it normally
  if (media.length === 1) {
    const item = media[0];
    return (
      <div className="relative flex justify-center">
        {item.type === "image" ? (
          <img
            src={item.url}
            alt="Media"
            className="max-h-96 object-cover rounded-lg"
          />
        ) : (
          <video
            src={item.url}
            controls
            className="max-h-96 object-cover rounded-lg"
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
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* Main Image/Video Display */}
      <div className="relative">
        {currentItem.type === "image" ? (
          <img
            src={currentItem.url}
            alt={`Media ${currentIndex + 1} of ${media.length}`}
            className="w-full max-h-96 object-contain bg-black"
          />
        ) : (
          <video
            src={currentItem.url}
            controls
            className="w-full max-h-96 object-contain bg-black"
          />
        )}

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      </div>

      {/* Dots Indicator */}
      {media.length > 1 && media.length <= 10 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail Strip for many images */}
      {media.length > 10 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(index, e)}
                className={`flex-shrink-0 w-12 h-8 rounded overflow-hidden border-2 transition-all duration-200 ${
                  index === currentIndex
                    ? "border-white"
                    : "border-transparent hover:border-white/50"
                }`}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
