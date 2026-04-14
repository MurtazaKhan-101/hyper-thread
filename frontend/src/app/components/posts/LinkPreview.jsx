"use client";

import { Spinner } from "../ui";

export const LinkPreview = ({ linkPreview, isGeneratingPreview = false }) => {
  if (isGeneratingPreview) {
    return (
      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Generating link preview...
          </span>
        </div>
      </div>
    );
  }

  if (!linkPreview) return null;

  return (
    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        {linkPreview.thumbnail && (
          <img
            src={linkPreview.thumbnail}
            alt="Link preview"
            className="w-16 h-16 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate break-words">
            {linkPreview.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 break-words">
            {linkPreview.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 break-all">
            {new URL(linkPreview.url).hostname}
          </p>
        </div>
      </div>
    </div>
  );
};
