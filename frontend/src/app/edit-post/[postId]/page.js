"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Spinner } from "../../components/ui";
import {
  MediaPreview,
  MediaUpload,
  LinkPreview,
  CategorySelector,
} from "../../components/posts";
import { postService } from "../../lib/posts";
import { ROUTES } from "../../lib/constants";
import { FileText, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId;
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
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const [originalPost, setOriginalPost] = useState(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      uploadedMedia.forEach((media) => {
        if (media.preview) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, loading, isAuthenticated, router]);

  // Load existing post data
  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const response = await postService.getPostById(postId);

        if (response.success) {
          const post = response.post;

          // Check if user is the author
          if (post.author._id !== user?._id) {
            alert("You can only edit your own posts");
            router.push(ROUTES.DASHBOARD);
            return;
          }

          setOriginalPost(post);
          setTitle(post.title || "");
          setContent(post.content || "");
          setCategory(post.category || "");
          setTags(post.tags ? post.tags.join(", ") : "");
          setActiveTab(post.postType || "text");

          if (post.postType === "link") {
            setLinkUrl(post.linkUrl || "");
            if (post.linkTitle || post.linkDescription || post.linkThumbnail) {
              setLinkPreview({
                url: post.linkUrl,
                title: post.linkTitle,
                description: post.linkDescription,
                thumbnail: post.linkThumbnail,
              });
            }
          }

          if (post.postType === "media" && post.media) {
            setUploadedMedia(post.media);
          }
        }
      } catch (error) {
        console.error("Error loading post:", error);
        alert("Failed to load post");
        router.push(ROUTES.DASHBOARD);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && postId) {
      loadPost();
    }
  }, [postId, user, router]);

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

  // Generate link preview with debounce
  useEffect(() => {
    if (activeTab !== "link" || !linkUrl.trim()) {
      return;
    }

    // Don't regenerate if URL hasn't changed
    if (linkUrl === originalPost?.linkUrl && linkPreview) {
      return;
    }

    const generatePreview = async () => {
      try {
        setIsGeneratingPreview(true);
        const response = await postService.generateLinkPreview(linkUrl);
        setLinkPreview(response.preview);
      } catch (error) {
        console.error("Failed to generate preview:", error);
      } finally {
        setIsGeneratingPreview(false);
      }
    };

    const timeoutId = setTimeout(generatePreview, 1000);
    return () => clearTimeout(timeoutId);
  }, [linkUrl, activeTab]);

  const handleMediaUpload = async (files) => {
    if (files.length === 0) return;

    // Check if trying to upload video when images exist or vice versa
    const hasVideo = uploadedMedia.some((media) => media.type === "video");
    const hasImages = uploadedMedia.some((media) => media.type === "image");
    const uploadingVideo = files.some((file) => file.type.startsWith("video/"));

    if (hasVideo || (hasImages && uploadingVideo)) {
      setErrors({
        media:
          "You can upload either one video or multiple images, but not both",
      });
      return;
    }

    try {
      setIsUploading(true);
      setErrors({});

      // Create preview entries
      const newMediaPreviews = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        uploading: true,
      }));

      setUploadedMedia((prev) => [...prev, ...newMediaPreviews]);

      // Upload files
      const response = await postService.uploadMedia(files);

      if (response.success) {
        setUploadedMedia((prev) =>
          prev.map((media) => {
            if (media.uploading) {
              const uploadedFile = response.files.find(
                (f) => f.originalName === media.file?.name
              );
              if (uploadedFile) {
                return {
                  ...uploadedFile,
                  uploading: false,
                };
              }
            }
            return media;
          })
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrors({ media: "Failed to upload media files" });
      setUploadedMedia((prev) => prev.filter((media) => !media.uploading));
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index) => {
    setUploadedMedia((prev) => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);

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
      } else if (activeTab === "media") {
        postData.mediaFiles = uploadedMedia.filter((media) => !media.uploading);
      }

      const response = await postService.updatePost(postId, postData);

      if (response.success) {
        router.push("/profile");
      }
    } catch (error) {
      setErrors({ submit: error.message || "Failed to update post" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || isLoading) {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Edit Post
        </h1>

        {/* Post Type Indicator (Read-only) */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <div
            className={`flex items-center gap-2 px-4 py-2 border-b-2 ${
              activeTab === "text"
                ? "border-[#0079D3] text-[#0079D3]"
                : activeTab === "media"
                ? "border-[#0079D3] text-[#0079D3]"
                : "border-[#0079D3] text-[#0079D3]"
            }`}
          >
            {activeTab === "text" && (
              <>
                <FileText size={18} />
                Text Post
              </>
            )}
            {activeTab === "media" && (
              <>
                <ImageIcon size={18} />
                Media Post
              </>
            )}
            {activeTab === "link" && (
              <>
                <LinkIcon size={18} />
                Link Post
              </>
            )}
          </div>
          <span className="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
            Post type cannot be changed
          </span>
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
              onClick={() => router.push("/profile")}
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
                "Update Post"
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
