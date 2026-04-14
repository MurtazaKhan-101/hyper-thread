const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Stripe webhook endpoint
// IMPORTANT: This must use raw body, not JSON middleware
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

module.exports = router;
