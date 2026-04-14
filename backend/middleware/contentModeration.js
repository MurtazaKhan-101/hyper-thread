const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

// Simple profanity word list (CommonJS compatible)
const profanityList = [
  "fuck",
  "shit",
  "bitch",
  "ass",
  "damn",
  "crap",
  "piss",
  "dick",
  "cock",
  "pussy",
  "bastard",
  "slut",
  "whore",
  "fag",
  "nigger",
  "cunt",
  "retard",
];

// Simple profanity filter implementation
class ProfanityFilter {
  constructor() {
    this.words = profanityList;
  }

  isProfane(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return this.words.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      return regex.test(lowerText);
    });
  }

  clean(text) {
    if (!text) return text;
    let cleanText = text;
    this.words.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      cleanText = cleanText.replace(regex, "*".repeat(word.length));
    });
    return cleanText;
  }

  // Count how many profane words were found
  countProfaneWords(text) {
    if (!text) return 0;
    const lowerText = text.toLowerCase();
    let count = 0;
    this.words.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const matches = lowerText.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    return count;
  }
}

// Initialize profanity filter
const filter = new ProfanityFilter();

// Add custom bad words if needed
// filter.addWords('word1', 'word2');

// Perspective API configuration (optional - requires API key)
const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_API_URL =
  "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze";

/**
 * Check text for profanity using bad-words library
 */
const checkProfanity = (text) => {
  if (!text) return { detected: false, score: 0 };

  try {
    const isProfane = filter.isProfane(text);
    const cleanText = filter.clean(text);
    const profaneWordCount = filter.countProfaneWords(text);

    // Calculate profanity score
    // If any profane words detected, minimum score is 0.6 (above flagging threshold)
    // Add 0.2 for each additional profane word (capped at 1.0)
    let profanityScore = 0;
    if (profaneWordCount > 0) {
      profanityScore = Math.min(0.6 + (profaneWordCount - 1) * 0.2, 1.0);
    }

    return {
      detected: isProfane,
      score: profanityScore,
      cleanText: cleanText,
      profaneWordCount: profaneWordCount,
    };
  } catch (error) {
    console.error("Error checking profanity:", error);
    return { detected: false, score: 0 };
  }
};

/**
 * Check text for toxicity using Google Perspective API
 */
const checkToxicity = async (text) => {
  if (!PERSPECTIVE_API_KEY || !text) {
    return { detected: false, score: 0 };
  }

  try {
    const response = await axios.post(
      `${PERSPECTIVE_API_URL}?key=${PERSPECTIVE_API_KEY}`,
      {
        comment: { text },
        languages: ["en"],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          THREAT: {},
          PROFANITY: {},
        },
      },
      {
        timeout: 5000, // 5 second timeout
      }
    );

    const scores = response.data.attributeScores;

    return {
      detected: scores.TOXICITY?.summaryScore?.value > 0.7,
      score: scores.TOXICITY?.summaryScore?.value || 0,
      severeToxicity: scores.SEVERE_TOXICITY?.summaryScore?.value || 0,
      identityAttack: scores.IDENTITY_ATTACK?.summaryScore?.value || 0,
      insult: scores.INSULT?.summaryScore?.value || 0,
      threat: scores.THREAT?.summaryScore?.value || 0,
      profanity: scores.PROFANITY?.summaryScore?.value || 0,
    };
  } catch (error) {
    console.error("Error checking toxicity:", error.message);
    return { detected: false, score: 0 };
  }
};

/**
 * Check text for spam patterns
 */
const checkSpam = (text) => {
  if (!text) return { detected: false, score: 0 };

  let spamScore = 0;
  const spamPatterns = [
    // URL patterns
    { pattern: /(https?:\/\/[^\s]+)/gi, weight: 0.2 },
    // Multiple URLs
    { pattern: /(https?:\/\/[^\s]+.*https?:\/\/[^\s]+)/gi, weight: 0.4 },
    // Excessive caps
    { pattern: /[A-Z]{5,}/g, weight: 0.1 },
    // Repeated characters
    { pattern: /(.)\1{4,}/gi, weight: 0.15 },
    // Common spam phrases
    {
      pattern:
        /\b(click here|buy now|limited time|act now|free money|make money fast|work from home|viagra|cialis)\b/gi,
      weight: 0.5,
    },
    // Excessive punctuation
    { pattern: /[!?]{3,}/g, weight: 0.1 },
    // Phone numbers
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, weight: 0.15 },
    // Email addresses (excessive)
    {
      pattern: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
      weight: 0.15,
    },
  ];

  spamPatterns.forEach(({ pattern, weight }) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      spamScore += weight * matches.length;
    }
  });

  // Cap spam score at 1.0
  spamScore = Math.min(spamScore, 1.0);

  return {
    detected: spamScore > 0.5,
    score: spamScore,
  };
};

/**
 * Middleware to moderate post content
 */
const moderatePost = async (req, res, next) => {
  try {
    const { title, content, type } = req.body;

    // Combine title and content for analysis
    const textToAnalyze = `${title || ""} ${content || ""}`.trim();

    if (!textToAnalyze) {
      return next();
    }

    // Run moderation checks
    const profanityCheck = checkProfanity(textToAnalyze);
    const spamCheck = checkSpam(textToAnalyze);

    // Initialize moderation data
    req.moderationData = {
      moderationStatus: "approved",
      moderationScores: {
        profanity: {
          score: profanityCheck.score,
          detected: profanityCheck.detected,
        },
        spam: {
          score: spamCheck.score,
          detected: spamCheck.detected,
        },
        toxicity: {
          score: 0,
          detected: false,
        },
      },
    };

    // Check toxicity with Perspective API (async, but optional)
    if (PERSPECTIVE_API_KEY) {
      try {
        const toxicityCheck = await checkToxicity(textToAnalyze);
        req.moderationData.moderationScores.toxicity = {
          score: toxicityCheck.score,
          detected: toxicityCheck.detected,
          severeToxicity: toxicityCheck.severeToxicity,
          identityAttack: toxicityCheck.identityAttack,
          insult: toxicityCheck.insult,
          threat: toxicityCheck.threat,
          profanity: toxicityCheck.profanity,
        };
      } catch (error) {
        console.warn(
          "Toxicity check failed, continuing without it:",
          error.message
        );
      }
    }

    // Determine moderation status
    const highProfanity = profanityCheck.score > 0.5;
    const highSpam = spamCheck.score > 0.6;
    const highToxicity =
      req.moderationData.moderationScores.toxicity.score > 0.7;

    // Auto-reject content with profanity or high spam/toxicity
    if (highProfanity) {
      return res.status(400).json({
        message: "Content contains inappropriate language and cannot be posted",
        moderationScores: {
          profanity: req.moderationData.moderationScores.profanity,
        },
      });
    }

    if (highSpam || highToxicity) {
      return res.status(400).json({
        message: "Content violates community guidelines and cannot be posted",
        moderationScores: req.moderationData.moderationScores,
      });
    }

    // Flag content with moderate issues for review
    if (
      profanityCheck.score > 0.2 ||
      spamCheck.score > 0.3 ||
      req.moderationData.moderationScores.toxicity.score > 0.5
    ) {
      req.moderationData.moderationStatus = "pending_review";
    }

    next();
  } catch (error) {
    console.error("Error in content moderation:", error);
    // Don't block post on moderation error, just log it
    req.moderationData = {
      moderationStatus: "pending_review",
      moderationScores: {
        profanity: { score: 0, detected: false },
        spam: { score: 0, detected: false },
        toxicity: { score: 0, detected: false },
      },
    };
    next();
  }
};

/**
 * Middleware to moderate comments
 */
const moderateComment = async (req, res, next) => {
  try {
    // Check both 'comment' and 'content' fields (different controllers use different field names)
    const commentText = req.body.comment || req.body.content;

    if (!commentText) {
      return next();
    }

    // Run quick profanity and spam checks
    const profanityCheck = checkProfanity(commentText);
    const spamCheck = checkSpam(commentText);

    // Block comments with any profanity
    if (profanityCheck.score > 0.5) {
      return res.status(400).json({
        message: "Comment contains inappropriate language and cannot be posted",
        profanityDetected: true,
      });
    }

    // Block highly spammy comments
    if (spamCheck.score > 0.7) {
      return res.status(400).json({
        message: "Comment appears to be spam and cannot be posted",
        spamDetected: true,
      });
    }

    // Store moderation data for logging
    req.moderationData = {
      profanity: profanityCheck,
      spam: spamCheck,
    };

    next();
  } catch (error) {
    console.error("Error in comment moderation:", error);
    next();
  }
};

/**
 * Rate limiting for spam prevention
 */
const rateLimitByUser = (maxRequests, windowMs) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userRecord = userRequests.get(userId) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Reset if window expired
    if (now > userRecord.resetTime) {
      userRecord.count = 0;
      userRecord.resetTime = now + windowMs;
    }

    userRecord.count++;
    userRequests.set(userId, userRecord);

    if (userRecord.count > maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please wait before posting again.",
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000),
      });
    }

    next();
  };
};

module.exports = {
  moderatePost,
  moderateComment,
  rateLimitByUser,
  checkProfanity,
  checkToxicity,
  checkSpam,
};
