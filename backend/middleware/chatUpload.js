const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");

// Configure S3/R2 client
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow only image files for chat
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for chat images
  },
  fileFilter,
});

// Middleware to upload chat image to R2
const uploadChatImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `chat/${crypto.randomUUID()}${fileExtension}`;

    // Upload to R2
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: "public, max-age=31536000", // 1 year cache
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate public URL
    const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // Add image URL to request for use in chat message
    req.imageUrl = imageUrl;
    next();
  } catch (error) {
    console.error("Error uploading chat image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

module.exports = {
  upload: upload.single("image"),
  uploadChatImage,
};
