"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { ChatProvider } from "./context/ChatContext";
import LayoutWrapper from "./components/layout/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>newsnatter - Connect & Share</title>
        <meta name="description" content="A modern community platform" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SearchProvider>
            <ChatProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ChatProvider>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
