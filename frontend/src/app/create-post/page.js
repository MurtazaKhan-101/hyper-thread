"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Spinner, UpgradeBanner } from "../components/ui";
import {
  MediaPreview,
  MediaUpload,
  LinkPreview,
  CategorySelector,
} from "../components/posts";
import { postService } from "../lib/posts";
import { ROUTES } from "../lib/constants";
import { FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      uploadedMedia.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, []);

  // Keyboard navigation for media preview
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (uploadedMedia.length > 1 && activeTab === "media") {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCurrentPreviewIndex((prev) =>
            prev === 0 ? uploadedMedia.length - 1 : prev - 1
          );
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setCurrentPreviewIndex((prev) =>
            prev === uploadedMedia.length - 1 ? 0 : prev + 1
          );
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [uploadedMedia.length, activeTab]);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Check if user is premium
  const isPremium = user?.isPremium || false;
  const adminUser = user?.role === "admin";
  const hasPremiumAccess = isPremium || adminUser;

  // Generate link preview with debounce
  useEffect(() => {
    if (activeTab !== "link" || !linkUrl.trim()) {
      setLinkPreview(null);
      return;
    }

    const generatePreview = async () => {
      try {
        setIsGeneratingPreview(true);
        const response = await postService.generateLinkPreview(linkUrl);
        setLinkPreview(response.preview);
      } catch (error) {
        console.error("Failed to generate preview:", error);
        setLinkPreview(null);
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    const timeoutId = setTimeout(generatePreview, 1000);
    return () => clearTimeout(timeoutId);
  }, [linkUrl, activeTab]);

  const handleMediaUpload = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);

      // Check file types and restrictions
      const images = files.filter((file) => file.type.startsWith("image/"));
      const videos = files.filter((file) => file.type.startsWith("video/"));

      // Check if adding videos when images already exist or vice versa
      const currentImages = uploadedMedia.filter(
        (media) => media.type === "image"
      );
      const currentVideos = uploadedMedia.filter(
        (media) => media.type === "video"
      );

      if (videos.length > 0 && currentImages.length > 0) {
        setErrors({
          media:
            "Cannot mix images and videos. Please remove existing images first.",
        });
        setIsUploading(false);
        return;
      }

      if (images.length > 0 && currentVideos.length > 0) {
        setErrors({
          media:
            "Cannot mix images and videos. Please remove existing video first.",
        });
        setIsUploading(false);
        return;
      }

      // Restrict to one video only
      if (videos.length > 1) {
        setErrors({ media: "Only one video is allowed per post." });
        setIsUploading(false);
        return;
      }

      if (videos.length > 0 && currentVideos.length > 0) {
        setErrors({
          media:
            "Only one video is allowed per post. Please remove the existing video first.",
        });
        setIsUploading(false);
        return;
      }

      // Create previews immediately
      const newPreviews = [];
      for (const file of files) {
        const preview = {
          file,
          type: file.type.startsWith("image/") ? "image" : "video",
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          uploading: true,
        };
        newPreviews.push(preview);
      }

      // Add previews to state immediately
      setUploadedMedia((prev) => [...prev, ...newPreviews]);

      // Set current preview to the first new item if this is the first upload
      if (uploadedMedia.length === 0) {
        setCurrentPreviewIndex(0);
      }

      // Upload files to server
      const response = await postService.uploadMedia(files);

      // Update the previews with server URLs
      setUploadedMedia((prev) => {
        const updated = [...prev];
        newPreviews.forEach((preview, index) => {
          const serverFile = response.files[index];
          const previewIndex = updated.findIndex(
            (item) => item.preview === preview.preview
          );
          if (previewIndex !== -1) {
            updated[previewIndex] = {
              ...serverFile,
              uploading: false,
            };
          }
        });
        return updated;
      });

      // Clear any previous errors
      setErrors((prev) => ({ ...prev, media: null }));
    } catch (error) {
      console.error("Upload error:", error);
      setErrors({ media: "Failed to upload media files" });
      // Remove failed uploads from preview
      setUploadedMedia((prev) => prev.filter((media) => !media.uploading));
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index) => {
    setUploadedMedia((prev) => {
      const updated = [...prev];
      // Clean up preview URL if it exists
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);

      // Adjust currentPreviewIndex if necessary
      if (index <= currentPreviewIndex && currentPreviewIndex > 0) {
        setCurrentPreviewIndex(currentPreviewIndex - 1);
      } else if (updated.length === 0) {
        setCurrentPreviewIndex(0);
      } else if (currentPreviewIndex >= updated.length) {
        setCurrentPreviewIndex(updated.length - 1);
      }

      return updated;
    });
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

    if (
      activeTab === "media" &&
      uploadedMedia.filter((media) => !media.uploading).length === 0
    ) {
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
        category: category || null,
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
        postData.mediaFiles = uploadedMedia.filter((media) => !media.uploading);
        const response = await postService.createMediaPost(postData);
        router.push(ROUTES.DASHBOARD);
      } else {
        const response = await postService.createPost(postData);
        router.push(ROUTES.DASHBOARD);
      }
    } catch (error) {
      setErrors({ submit: error.message || "Failed to create post" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show upgrade prompt if user is not premium
  if (!hasPremiumAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Create a Post
          </h1>
          <UpgradeBanner feature="post" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Create a Post
        </h1>

        {/* Post Type Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === "text"
                ? "border-[#0079D3] text-[#0079D3]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <FileText size={18} />
            Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === "media"
                ? "border-[#0079D3] text-[#0079D3]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <ImageIcon size={18} />
            Images & Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === "link"
                ? "border-[#0079D3] text-[#0079D3]"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <LinkIcon size={18} />
            Link
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              className="text-lg"
            />
          </div>

          {/* Content Input */}
          {(activeTab === "text" || activeTab === "media") && (
            <div className="mb-4">
              <textarea
                placeholder={`Text (optional)`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
            </div>
          )}

          {/* Link URL Input */}
          {activeTab === "link" && (
            <div className="mb-4">
              <Input
                type="url"
                placeholder="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                error={errors.linkUrl}
              />

              <LinkPreview
                linkPreview={linkPreview}
                isGeneratingPreview={isGeneratingPreview}
              />
            </div>
          )}

          {/* Media Upload */}
          {activeTab === "media" && (
            <div className="mb-4">
              <MediaUpload
                onFileSelect={handleMediaUpload}
                isUploading={isUploading}
                uploadedMedia={uploadedMedia}
                disabled={
                  isUploading ||
                  uploadedMedia.some((media) => media.type === "video")
                }
              />

              <MediaPreview
                media={uploadedMedia}
                onRemove={removeMedia}
                onAddMore={handleMediaUpload}
                canAddMore={
                  uploadedMedia.length > 0 &&
                  uploadedMedia.every((media) => media.type === "image") &&
                  !uploadedMedia.some((media) => media.uploading)
                }
                isUploading={isUploading}
              />

              {errors.media && (
                <p className="text-red-500 text-sm mt-2">{errors.media}</p>
              )}
            </div>
          )}

          {/* Category and Tags */}
          <CategorySelector
            value={category}
            onChange={setCategory}
            error={errors.category}
          />

          <div className="mb-6">
            <Input
              type="text"
              placeholder="Tags (comma separated, optional)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              error={errors.tags}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(ROUTES.DASHBOARD)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-[#0079D3] hover:bg-[#0066b3] flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm mt-4 text-center">
              {errors.submit}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
