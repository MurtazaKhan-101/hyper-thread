const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const trendingKeywordController = require("../controllers/trendingKeywordController");

// All trending keyword management routes are admin-only
router.use(authenticate, authorize("admin"));

router.get("/", trendingKeywordController.listKeywords);
router.post("/", trendingKeywordController.createKeyword);
router.put("/:id", trendingKeywordController.updateKeyword);
router.delete("/:id", trendingKeywordController.deleteKeyword);

module.exports = router;
