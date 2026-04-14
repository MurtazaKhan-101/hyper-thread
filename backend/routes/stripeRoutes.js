const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripeController");
const { authenticate } = require("../middleware/auth");

// Create checkout session (protected route)
router.post(
  "/create-checkout-session",
  authenticate,
  stripeController.createCheckoutSession
);

// Create customer portal session (protected route)
router.post(
  "/create-portal-session",
  authenticate,
  stripeController.createPortalSession
);

// Get subscription status (protected route)
router.get(
  "/subscription-status",
  authenticate,
  stripeController.getSubscriptionStatus
);

// Cancel subscription (protected route)
router.post(
  "/cancel-subscription",
  authenticate,
  stripeController.cancelSubscription
);

// Reactivate subscription (protected route)
router.post(
  "/reactivate-subscription",
  authenticate,
  stripeController.reactivateSubscription
);

module.exports = router;
