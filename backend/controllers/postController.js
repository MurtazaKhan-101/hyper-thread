const { Post } = require("../models/Posts");
const { Comment } = require("../models/Comments");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const linkPreviewService = require("../utils/linkPreview");

// Configure Cloudflare R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

class PostController {
  //   // Helper function to recursively populate comments and their replies
  async populateCommentsRecursively(comments, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return comments;

    const populatedComments = await Comment.populate(comments, [
      {
        path: "user",
        select: "firstName lastName username profileImage isVerified",
      },
      {
        path: "replies",
        populate: {
          path: "user",
          select: "firstName lastName username profileImage isVerified",
        },
      },
    ]);

    // Recursively populate nested replies
    for (let comment of populatedComments) {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = await this.populateCommentsRecursively(
          comment.replies,
          depth + 1,
          maxDepth
        );
      }
    }

    return populatedComments;
  }
  // Create a new post
  async createPost(req, res) {
    try {
      const {
        title,
        content,
        postType,
        flair,
        category,
        tags,
        linkUrl,
        linkTitle,
        linkDescription,
        linkThumbnail,
        isMarkdown,
      } = req.body;
      const userId = req.user._id;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }

      if (title.length > 300) {
        return res.status(400).json({
          success: false,
          message: "Title must be 300 characters or less",
        });
      }

      // Validate post type
      const validPostTypes = ["text", "media", "link"];
      if (!validPostTypes.includes(postType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post type",
        });
      }

      // Validate link posts
      if (postType === "link") {
        if (!linkUrl || !/^https?:\/\/.+/.test(linkUrl)) {
          return res.status(400).json({
            success: false,
            message: "Valid URL is required for link posts",
          });
        }
      }

      // Process tags
      const processedTags = Array.isArray(tags)
        ? tags.filter((tag) => tag.trim()).slice(0, 5)
        : [];

      // Create post object
      const postData = {
        title: title.trim(),
        content: content?.trim() || "",
        author: userId,
        postType: postType || "text",
        flair: flair?.trim() || null,
        category: category?.trim() || null,
        tags: processedTags,
        status: "published",
        isMarkdown: Boolean(isMarkdown),
        contentFormat: isMarkdown ? "markdown" : "plain",
      };

      // Add link-specific fields
      if (postType === "link") {
        postData.linkUrl = linkUrl.trim();
        postData.linkTitle = linkTitle?.trim() || null;
        postData.linkDescription = linkDescription?.trim() || null;
        postData.linkThumbnail = linkThumbnail?.trim() || null;

        // Generate link preview if not provided
        if (!linkTitle || !linkDescription) {
          try {
            const preview = await linkPreviewService.generateLinkPreview(
              linkUrl.trim()
            );
            if (preview.success) {
              postData.linkTitle = linkTitle?.trim() || preview.data.title;
              postData.linkDescription =
                linkDescription?.trim() || preview.data.description;
              postData.linkThumbnail = preview.data.thumbnail;
            }
          } catch (error) {
            console.error("Error generating link preview:", error);
            // Continue without preview
          }
        }
      }

      // Add moderation data from middleware
      if (req.moderationData) {
        postData.moderationStatus = req.moderationData.moderationStatus;
        postData.moderationScores = req.moderationData.moderationScores;
      }

      const newPost = new Post(postData);
      await newPost.save();

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.postsCount": 1 },
      });

      // Populate author info
      await newPost.populate(
        "author",
        "firstName lastName username profileImage isVerified"
      );

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post: newPost,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating post",
      });
    }
  }

  // Upload media files to R2
  async uploadMedia(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files provided",
        });
      }

      const uploadedFiles = [];

      for (const file of req.files) {
        // Generate unique filename
        const fileExt = path.extname(file.originalname);
        const fileName = `posts/${crypto.randomUUID()}${fileExt}`;

        // Determine media type
        const mediaType = file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
          ? "video"
          : "image";

        // Upload to R2
        const uploadParams = {
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        await r2Client.send(new PutObjectCommand(uploadParams));

        const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

        uploadedFiles.push({
          type: mediaType,
          url: fileUrl,
          originalName: file.originalname,
          size: file.size,
        });
      }

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        files: uploadedFiles,
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading files",
      });
    }
  }

  // Create media post with uploaded files
  async createMediaPost(req, res) {
    try {
      const { title, content, flair, category, tags, mediaFiles, isMarkdown } =
        req.body;
      const userId = req.user._id;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }

      if (
        !mediaFiles ||
        !Array.isArray(mediaFiles) ||
        mediaFiles.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one media file is required for media posts",
        });
      }

      // Process tags
      const processedTags = Array.isArray(tags)
        ? tags.filter((tag) => tag.trim()).slice(0, 5)
        : [];

      // Create post
      const postData = {
        title: title.trim(),
        content: content?.trim() || "",
        author: userId,
        postType: "media",
        flair: flair?.trim() || null,
        category: category?.trim() || null,
        tags: processedTags,
        media: mediaFiles,
        status: "published",
        isMarkdown: Boolean(isMarkdown),
        contentFormat: isMarkdown ? "markdown" : "plain",
      };

      const newPost = new Post(postData);
      await newPost.save();

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.postsCount": 1 },
      });

      // Populate author info
      await newPost.populate(
        "author",
        "firstName lastName username profileImage isVerified"
      );

      res.status(201).json({
        success: true,
        message: "Media post created successfully",
        post: newPost,
      });
    } catch (error) {
      console.error("Error creating media post:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating media post",
      });
    }
  }

  // Get all posts with pagination
  async getPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter
      const filter = { status: "published" };

      if (
        req.query.postType &&
        ["text", "media", "link"].includes(req.query.postType)
      ) {
        filter.postType = req.query.postType;
      }

      if (req.query.author) {
        filter.author = req.query.author;
      }

      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.tags) {
        const tagArray = Array.isArray(req.query.tags)
          ? req.query.tags
          : [req.query.tags];
        filter.tags = { $in: tagArray };
      }

      // Sort options
      let sortOption = {};
      switch (req.query.sort) {
        case "oldest":
          sortOption = { createdAt: 1 };
          break;
        case "likes":
          sortOption = { likes: -1, createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // newest first
      }

      const posts = await Post.find(filter)
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "firstName lastName username profileImage isVerified",
          },
        })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPosts = await Post.countDocuments(filter);
      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        posts: posts,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPosts: totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching posts",
      });
    }
  }
  // Get single post by ID
  async getPostById(req, res) {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId)
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .populate({
          path: "comments",
          populate: {
            path: "user",
            select: "firstName lastName username profileImage isVerified",
          },
        });

      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Populate comments recursively
      if (post.comments && post.comments.length > 0) {
        post.comments = await this.populateCommentsRecursively(post.comments);
      }

      res.status(200).json({
        success: true,
        post: post,
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching post",
      });
    }
  }

  // Like/unlike a post
  async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const hasLiked = post.likedBy.includes(userId);

      if (hasLiked) {
        // Unlike the post
        post.likedBy = post.likedBy.filter((id) => !id.equals(userId));
        post.likes = Math.max(0, post.likes - 1);

        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { "stats.likesGiven": -1 },
        });

        // Update post author stats
        if (!post.author.equals(userId)) {
          await User.findByIdAndUpdate(post.author, {
            $inc: { "stats.likesReceived": -1 },
          });
        }
      } else {
        // Like the post
        post.likedBy.push(userId);
        post.likes += 1;

        // Update user stats
        await User.findByIdAndUpdate(userId, {
          $inc: { "stats.likesGiven": 1 },
        });

        // Update post author stats
        if (!post.author.equals(userId)) {
          await User.findByIdAndUpdate(post.author, {
            $inc: { "stats.likesReceived": 1 },
          });
        }
      }

      await post.save();

      res.status(200).json({
        success: true,
        message: hasLiked ? "Post unliked" : "Post liked",
        liked: !hasLiked,
        likes: post.likes,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({
        success: false,
        message: "Server error toggling like",
      });
    }
  }

  // Generate link preview
  async generateLinkPreview(req, res) {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "URL is required",
        });
      }

      const preview = await linkPreviewService.generateLinkPreview(url);

      res.status(200).json({
        success: true,
        preview: preview.data,
        generated: preview.success,
      });
    } catch (error) {
      console.error("Error generating link preview:", error);
      res.status(500).json({
        success: false,
        message: "Server error generating link preview",
      });
    }
  }

  // Get trending posts (based on likes and comments in last 24 hours)
  async getTrendingPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get posts from last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const posts = await Post.find({
        status: "published",
        createdAt: { $gte: twentyFourHoursAgo },
      })
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .populate(
          "comments.user",
          "firstName lastName username profileImage isVerified"
        )
        .sort({ likes: -1, commentCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPosts = await Post.countDocuments({
        status: "published",
        createdAt: { $gte: twentyFourHoursAgo },
      });

      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        posts: posts,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPosts: totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching trending posts",
      });
    }
  }

  // Search posts
  async searchPosts(req, res) {
    try {
      const { q } = req.query; // search query
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters long",
        });
      }

      const searchRegex = new RegExp(q.trim(), "i");

      const filter = {
        status: "published",
        $or: [
          { title: { $regex: searchRegex } },
          { content: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
          { flair: { $regex: searchRegex } },
          { category: { $regex: searchRegex } },
        ],
      };

      // Add category filter if specified
      if (req.query.category) {
        filter.category = req.query.category;
      }

      const posts = await Post.find(filter)
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .populate(
          "comments.user",
          "firstName lastName username profileImage isVerified"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPosts = await Post.countDocuments(filter);
      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        posts: posts,
        query: q.trim(),
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPosts: totalPosts,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({
        success: false,
        message: "Server error searching posts",
      });
    }
  }

  // Update post (author only)
  async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;
      const {
        title,
        content,
        flair,
        category,
        tags,
        linkUrl,
        linkTitle,
        linkDescription,
        linkThumbnail,
        mediaFiles,
        isMarkdown,
      } = req.body;

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check if user is the author
      if (!post.author.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own posts",
        });
      }

      // Validate title
      if (title !== undefined) {
        if (!title || !title.trim()) {
          return res.status(400).json({
            success: false,
            message: "Title is required",
          });
        }
        if (title.length > 300) {
          return res.status(400).json({
            success: false,
            message: "Title must be 300 characters or less",
          });
        }
        post.title = title.trim();
      }

      // Update content
      if (content !== undefined) {
        post.content = content.trim();
      }

      // Update flair
      if (flair !== undefined) {
        post.flair = flair?.trim() || null;
      }

      // Update category
      if (category !== undefined) {
        post.category = category?.trim() || null;
      }

      // Update tags
      if (tags !== undefined) {
        post.tags = Array.isArray(tags)
          ? tags.filter((tag) => tag.trim()).slice(0, 5)
          : [];
      }

      // Update markdown setting
      if (isMarkdown !== undefined) {
        post.isMarkdown = Boolean(isMarkdown);
        post.contentFormat = isMarkdown ? "markdown" : "plain";
      }

      // Update link-specific fields
      if (post.postType === "link") {
        if (linkUrl !== undefined) {
          if (!linkUrl || !/^https?:\/\/.+/.test(linkUrl)) {
            return res.status(400).json({
              success: false,
              message: "Valid URL is required for link posts",
            });
          }
          post.linkUrl = linkUrl.trim();

          // Generate new preview if URL changed
          if (post.linkUrl !== linkUrl.trim()) {
            try {
              const preview = await linkPreviewService.generateLinkPreview(
                linkUrl.trim()
              );
              if (preview.success) {
                post.linkTitle = preview.data.title;
                post.linkDescription = preview.data.description;
                post.linkThumbnail = preview.data.thumbnail;
              }
            } catch (error) {
              console.error("Error generating link preview:", error);
            }
          }
        }

        if (linkTitle !== undefined) {
          post.linkTitle = linkTitle?.trim() || null;
        }

        if (linkDescription !== undefined) {
          post.linkDescription = linkDescription?.trim() || null;
        }

        if (linkThumbnail !== undefined) {
          post.linkThumbnail = linkThumbnail?.trim() || null;
        }
      }

      // Update media files
      if (post.postType === "media" && mediaFiles !== undefined) {
        if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one media file is required for media posts",
          });
        }
        post.media = mediaFiles;
      }

      // Mark as edited
      post.isEdited = true;
      post.lastEditedAt = new Date();

      await post.save();

      // Populate author info
      await post.populate(
        "author",
        "firstName lastName username profileImage isVerified"
      );

      res.status(200).json({
        success: true,
        message: "Post updated successfully",
        post: post,
      });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating post",
      });
    }
  }

  // Delete post (author only)
  async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check if user is the author
      if (!post.author.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own posts",
        });
      }

      // Soft delete by updating status
      await post.deleteOne();

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.postsCount": -1 },
      });

      res.status(200).json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting post",
      });
    }
  }
}

const postController = new PostController();

module.exports = {
  createPost: postController.createPost.bind(postController),
  uploadMedia: [
    upload.array("media", 10),
    postController.uploadMedia.bind(postController),
  ],
  createMediaPost: postController.createMediaPost.bind(postController),
  getPosts: postController.getPosts.bind(postController),
  getPostById: postController.getPostById.bind(postController),
  getTrendingPosts: postController.getTrendingPosts.bind(postController),
  searchPosts: postController.searchPosts.bind(postController),
  toggleLike: postController.toggleLike.bind(postController),
  generateLinkPreview: postController.generateLinkPreview.bind(postController),
  updatePost: postController.updatePost.bind(postController),
  deletePost: postController.deletePost.bind(postController),
};
