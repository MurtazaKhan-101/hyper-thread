const { body, validationResult } = require("express-validator");

// Validation rules for creating posts
const validatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 300 })
    .withMessage("Title must be 300 characters or less"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 40000 })
    .withMessage("Content must be 40,000 characters or less"),

  body("postType")
    .optional()
    .isIn(["text", "media", "link"])
    .withMessage("Post type must be text, media, or link"),

  body("flair")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Flair must be 50 characters or less"),

  body("tags")
    .optional()
    .isArray({ max: 5 })
    .withMessage("Maximum 5 tags allowed"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 25 })
    .withMessage("Each tag must be between 1 and 25 characters"),

  body("linkUrl")
    .if(body("postType").equals("link"))
    .notEmpty()
    .withMessage("URL is required for link posts")
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Please provide a valid URL"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation rules for comments
const validateComment = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ max: 1000 })
    .withMessage("Comment must be 1000 characters or less"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation rules for link preview
const validateLinkPreview = [
  body("url")
    .notEmpty()
    .withMessage("URL is required")
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Please provide a valid URL"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validatePost,
  validateComment,
  validateLinkPreview,
};
