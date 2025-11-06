"use client";

import { useEffect, useState } from "react";

export const TypingIndicator = ({ typingUsers = [] }) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [typingUsers]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing${dots}`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing${dots}`;
    } else {
      return `${typingUsers[0]} and ${
        typingUsers.length - 1
      } others are typing${dots}`;
    }
  };

  return (
    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
      {getTypingText()}
    </div>
  );
};
