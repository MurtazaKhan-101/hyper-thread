"use client";

import { useState } from "react";
import { Newspaper, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { id: "entertainment", label: "Entertainment" },
  { id: "sports", label: "Sports" },
  { id: "music", label: "Music" },
  { id: "culture", label: "Culture" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health" },
  { id: "internet", label: "Internet" },
  { id: "history", label: "History" },
];

export const CategorySelector = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = CATEGORIES.find((cat) => cat.id === value);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Category
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Newspaper className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
        >
          {selectedCategory ? selectedCategory.label : "Select a category"}
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              No category
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 capitalize ${
                  value === category.id
                    ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};
