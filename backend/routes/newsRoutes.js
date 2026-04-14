const express = require("express");
const router = express.Router();
const newsApiController = require("../controllers/newsApiController");
const { authenticate } = require("../middleware/auth");

// Get all external news grouped by category
router.get("/external", authenticate, newsApiController.getAllExternalNews);

// Get external news by category
router.get(
  "/external/:category",
  authenticate,
  newsApiController.getExternalNews
);

// Sync external news (admin only or cron job)
router.post("/sync", async (req, res) => {
  try {
    const result = await newsApiController.syncExternalNews();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error syncing external news",
      error: error.message,
    });
  }
});

module.exports = router;
