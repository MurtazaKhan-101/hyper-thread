"use client";

import { useState, useEffect } from "react";
import { Spinner, Button } from "../ui";
import { ImageIcon } from "lucide-react";

export const MediaPreview = ({
  media = [],
  onRemove,
  onAddMore,
  canAddMore = false,
  isUploading = false,
  showAddButton = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when media changes
  useEffect(() => {
    if (currentIndex >= media.length && media.length > 0) {
      setCurrentIndex(media.length - 1);
    }
  }, [media.length, currentIndex]);

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

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  return (
    <div className="mt-4">
      {/* Main Preview Area */}
      <div
        className="mx-auto bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
        style={{ aspectRatio: "16/9", maxHeight: "400px" }}
      >
        {currentMedia && (
          <div className="relative w-full h-full">
            {currentMedia.type === "image" ? (
              <img
                src={currentMedia.preview || currentMedia.url}
                alt="Preview"
                className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800"
              />
            ) : (
              <video
                src={currentMedia.preview || currentMedia.url}
                className="w-full h-full object-contain bg-gray-50 dark:bg-gray-800"
                controls
                muted
              />
            )}

            {/* Upload Progress Overlay */}
            {currentMedia.uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="flex items-center justify-center">
                    <Spinner size="lg" className="text-white mb-2" />
                  </div>
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}

            {/* Navigation Arrows (only show if multiple items) */}
            {media.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === 0 ? media.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
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
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      prev === media.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
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

            {/* Remove Button */}
            {onRemove && (
              <button
                onClick={() => onRemove(currentIndex)}
                disabled={currentMedia.uploading}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2 transition-all shadow-lg"
                title="Remove"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Index Indicator */}
            {media.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {media.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation (only show if multiple items) */}
      {media.length > 1 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex gap-2 overflow-x-auto p-2">
            {media.map((mediaItem, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  index === currentIndex
                    ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-50 shadow-lg"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
                title={mediaItem.name || `Media ${index + 1}`}
              >
                {mediaItem.type === "image" ? (
                  <img
                    src={mediaItem.preview || mediaItem.url}
                    alt="Thumbnail"
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

                {/* Upload indicator on thumbnail */}
                {mediaItem.uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Active indicator */}
                {index === currentIndex && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add more button for images only */}
      {canAddMore && showAddButton && onAddMore && (
        <div className="mt-4">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => onAddMore(Array.from(e.target.files))}
            className="hidden"
            id="add-more-media"
          />
          <label
            htmlFor="add-more-media"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Add More Images
          </label>
        </div>
      )}
    </div>
  );
};
