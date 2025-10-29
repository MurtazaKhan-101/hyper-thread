"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Spinner } from "../components/ui";
import { postService } from "../lib/posts";
import { ROUTES } from "../lib/constants";
import { FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
export default function CreatePostPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [flair, setFlair] = useState("");
  const [tags, setTags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Generate link preview when URL is entered
  useEffect(() => {
    const generatePreview = async () => {
      if (linkUrl && activeTab === "link") {
        setIsGeneratingPreview(true);
        try {
          const response = await postService.generateLinkPreview(linkUrl);
          console.log("Link preview response:", response);
          setLinkPreview(response.preview);
        } catch (error) {
          console.error("Failed to generate preview:", error);
        }
        setIsGeneratingPreview(false);
      }
    };

    const timeoutId = setTimeout(generatePreview, 1000);
    return () => clearTimeout(timeoutId);
  }, [linkUrl, activeTab]);

  const handleMediaUpload = async (files) => {
    try {
      setIsSubmitting(true);
      const response = await postService.uploadMedia(files);
      setUploadedMedia(response.files);
      setMediaFiles([]);
      setIsSubmitting(false);
    } catch (error) {
      setErrors({ media: "Failed to upload media files" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 300) {
      newErrors.title = "Title must be 300 characters or less";
    }

    if (activeTab === "link" && !linkUrl.trim()) {
      newErrors.linkUrl = "URL is required for link posts";
    }

    if (activeTab === "media" && uploadedMedia.length === 0) {
      newErrors.media = "At least one media file is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      let postData = {
        title: title.trim(),
        content: content.trim(),
        postType: activeTab,
        flair: flair.trim() || null,
        tags: tagArray,
        isMarkdown: false,
      };

      if (activeTab === "link") {
        postData = {
          ...postData,
          linkUrl: linkUrl.trim(),
          linkTitle: linkPreview?.title || null,
          linkDescription: linkPreview?.description || null,
          linkThumbnail: linkPreview?.thumbnail || null,
        };

        const response = await postService.createPost(postData);
        router.push(ROUTES.DASHBOARD);
      } else if (activeTab === "media") {
        postData.mediaFiles = uploadedMedia;
        const response = await postService.createMediaPost(postData);
        router.push(ROUTES.DASHBOARD);
      } else {
        const response = await postService.createPost(postData);
        router.push(ROUTES.DASHBOARD);
      }
    } catch (error) {
      setErrors({ submit: error.message || "Failed to create post" });
    }

    setIsSubmitting(false);
  };

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030303] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030303] py-4">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient
            id="buttons-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#1A94D0" />
            <stop offset="100%" stopColor="#A41C5E" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {/* Post Type Tabs with Gradient Background */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-around py-3">
              {/* Text Tab */}
              <button
                onClick={() => setActiveTab("text")}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300
                    ${
                      activeTab === "text"
                        ? "text-buttons-gradient"
                        : "text-blue-500 dark:text-blue-500"
                    }`}
              >
                <FileText
                  className={`w-5 h-5 transition-all duration-300 ${
                    activeTab === "text"
                      ? "stroke-buttons-gradient"
                      : "stroke-blue-500 dark:stroke-blue-400"
                  }`}
                />
                <span>Text</span>
              </button>

              {/* Link Tab */}
              <button
                onClick={() => setActiveTab("link")}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300
                    ${
                      activeTab === "link"
                        ? "text-buttons-gradient"
                        : "text-blue-500 dark:text-blue-400"
                    }`}
              >
                <LinkIcon
                  className={`w-5 h-5 transition-all duration-300 ${
                    activeTab === "link"
                      ? "stroke-buttons-gradient"
                      : "stroke-blue-500 dark:stroke-blue-400"
                  }`}
                />
                <span>Link</span>
              </button>

              {/* Media Tab */}
              <button
                onClick={() => setActiveTab("media")}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300
                    ${
                      activeTab === "media"
                        ? "text-buttons-gradient"
                        : "text-blue-500 dark:text-blue-400"
                    }`}
              >
                <ImageIcon
                  className={`w-5 h-5 transition-all duration-300 ${
                    activeTab === "media"
                      ? "stroke-buttons-gradient"
                      : "stroke-blue-500 dark:stroke-blue-400"
                  }`}
                />
                <span>Media</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Title Input */}
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Title*"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                className="text-lg"
                maxLength={300}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {title.length}/300
              </div>
            </div>

            {/* Link URL Input */}
            {activeTab === "link" && (
              <div className="mb-4">
                <Input
                  type="url"
                  placeholder="URL*"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  error={errors.linkUrl}
                />

                {/* Link Preview */}
                {isGeneratingPreview && (
                  <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Generating preview...
                      </span>
                    </div>
                  </div>
                )}

                {linkPreview && !isGeneratingPreview && (
                  <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex gap-3">
                      {linkPreview.thumbnail && (
                        <img
                          src={linkPreview.thumbnail}
                          alt="Link preview"
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {linkPreview.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {linkPreview.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new URL(linkPreview.url).hostname}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Media Upload */}
            {activeTab === "media" && (
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setMediaFiles(Array.from(e.target.files))}
                    className="hidden"
                    id="media-upload"
                  />
                  <label
                    htmlFor="media-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-4xl mb-2">
                      <ImageIcon />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag and drop images and videos, or{" "}
                      <span className="text-[#0079D3] underline">browse</span>
                    </p>
                  </label>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => handleMediaUpload(mediaFiles)}
                      disabled={isSubmitting}
                      variant="secondary"
                      className="mb-2"
                    >
                      {isSubmitting ? (
                        <Spinner size="sm" />
                      ) : (
                        `Upload ${mediaFiles.length} file(s)`
                      )}
                    </Button>
                  </div>
                )}

                {uploadedMedia.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedMedia.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type === "image" ? (
                          <img
                            src={file.url}
                            alt="Uploaded"
                            className="w-full h-24 object-cover rounded"
                          />
                        ) : (
                          <video
                            src={file.url}
                            className="w-full h-24 object-cover rounded"
                            controls
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {errors.media && (
                  <p className="text-red-500 text-sm mt-2">{errors.media}</p>
                )}
              </div>
            )}

            {/* Flair and Tags */}
            <div className="mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFlair(flair ? "" : "Discussion")}
                className="mb-4"
              >
                {flair ? `Flair: ${flair}` : "Add flair"}
              </Button>
            </div>

            {/* Content/Description */}
            <div className="mb-6">
              <textarea
                placeholder={
                  activeTab === "text"
                    ? "Text (optional)"
                    : "Description (optional)"
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                maxLength={40000}
              />
            </div>

            {/* Tags Input */}
            <div className="mb-6">
              <Input
                placeholder="Tags (comma separated, optional)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.DASHBOARD)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="min-w-20 flex items-center justify-center"
                variant="primary"
              >
                {isSubmitting ? <Spinner size="sm" /> : "Post"}
              </Button>
            </div>

            {errors.submit && (
              <p className="text-red-500 text-sm mt-4">{errors.submit}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
