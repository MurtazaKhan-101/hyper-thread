const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const onboardingController = require("../controllers/onboardingController");

router.post(
  "/generate-username",
  authenticate,
  onboardingController.generateUsernameSuggestions
);
router.post(
  "/check-username",
  authenticate,
  onboardingController.checkUsername
);
router.post("/username", authenticate, onboardingController.updateUsername);
router.post("/interests", authenticate, onboardingController.updateInterests);
router.get(
  "/interests",
  authenticate,
  onboardingController.getAvailableInterests
);

module.exports = router;
