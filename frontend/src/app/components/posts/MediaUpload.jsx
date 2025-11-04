"use client";

import { ImageIcon } from "lucide-react";

export const MediaUpload = ({
  onFileSelect,
  isUploading = false,
  uploadedMedia = [],
  disabled = false,
}) => {
  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => onFileSelect(Array.from(e.target.files))}
        className="hidden"
        id="media-upload"
        disabled={disabled || isUploading}
      />
      <label
        htmlFor="media-upload"
        className={`cursor-pointer flex flex-col items-center ${
          disabled ||
          isUploading ||
          uploadedMedia.some((media) => media.type === "video")
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        <div className="text-4xl mb-2">
          <ImageIcon />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {uploadedMedia.length === 0 ? (
            <>
              Drag and drop images and videos, or{" "}
              <span className="text-[#0079D3] underline">browse</span>
              <br />
              <span className="text-sm text-gray-500">
                Images: Multiple allowed • Videos: One only
              </span>
            </>
          ) : uploadedMedia.some((media) => media.type === "video") ? (
            <span className="text-sm text-gray-500">
              One video selected. Cannot add more media.
            </span>
          ) : (
            <>
              Add more images or{" "}
              <span className="text-[#0079D3] underline">browse</span>
            </>
          )}
        </p>
      </label>
    </div>
  );
};
