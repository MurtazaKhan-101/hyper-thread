const axios = require("axios");
const { Post } = require("../models/Posts");
const User = require("../models/User");
const GNEWS_BASE_URL = "https://gnews.io/api/v4";
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const CATEGORY_DELAY_MS = Number(process.env.GNEWS_CATEGORY_DELAY_MS || 1500);

// Category mapping: app categories to GNews categories
const CATEGORY_MAPPING = {
  politics: "world",
  business: "business",
  entertainment: "entertainment",
  lifestyle: "health",
  technology: "technology",
};

// Get or create the system user for external news posts
const getSystemUser = async () => {
  try {
    let systemUser = await User.findOne({ username: "newsnatter" });

    if (!systemUser) {
      systemUser = await User.create({
        username: "newsnatter",
        email: "newsaggregator@newsnatter.com",
        password: "N0tR3@lP@ssw0rd!ExternalNewsOnly",
        firstName: "News",
        lastName: "Natter",
        isVerified: true,
        isSystemAccount: true,
      });
    }

    return systemUser;
  } catch (error) {
    console.error("Error getting system user:", error);
    throw error;
  }
};

// Fetch news for a specific category from GNews
const fetchCategoryNews = async (appCategory, limit = 3) => {
  try {
    const newsApiCategory = CATEGORY_MAPPING[appCategory];
    if (!newsApiCategory) {
      console.log(`No mapping found for category: ${appCategory}`);
      return [];
    }

    if (!GNEWS_API_KEY) {
      console.error("Missing GNEWS_API_KEY; cannot fetch external news.");
      return [];
    }

    const response = await axios.get(`${GNEWS_BASE_URL}/top-headlines`, {
      params: {
        category: newsApiCategory,
        lang: "en",
        country: "us",
        max: limit,
        apikey: GNEWS_API_KEY,
      },
      timeout: 10000,
    });

    if (response.data && Array.isArray(response.data.articles)) {
      return response.data.articles;
    }

    return [];
  } catch (error) {
    console.error(
      `Error fetching news for category ${appCategory}:`,
      error.message,
    );
    return [];
  }
};

// Convert GNews article to Post format
const convertArticleToPost = (article, category, systemUserId) => {
  return {
    postType: "link",
    title: article.title || "Untitled News Article",
    content: article.description || "",
    author: systemUserId,
    category: category,
    linkUrl: article.url,
    linkThumbnail: article.image || null,
    linkTitle: article.title || null,
    linkDescription: article.description || null,
    isExternal: true,
    status: "published",
    moderationStatus: "approved",
  };
};

// Sync external news for all categories
exports.syncExternalNews = async () => {
  try {
    console.log("Starting external news sync...");
    const systemUser = await getSystemUser();
    const categories = Object.keys(CATEGORY_MAPPING);
    let totalSynced = 0;

    for (const category of categories) {
      try {
        // Delete old external posts for this category
        const deleteResult = await Post.deleteMany({
          isExternal: true,
          category: category,
        });
        console.log(
          `Deleted ${deleteResult.deletedCount} old external posts for ${category}`,
        );

        // Fetch new articles
        const articles = await fetchCategoryNews(category, 3);
        console.log(`Fetched ${articles.length} articles for ${category}`);

        // Convert and save new posts
        const posts = articles.map((article) =>
          convertArticleToPost(article, category, systemUser._id),
        );

        if (posts.length > 0) {
          await Post.insertMany(posts);
          totalSynced += posts.length;
          console.log(`Saved ${posts.length} external posts for ${category}`);
        }

        if (CATEGORY_DELAY_MS > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, CATEGORY_DELAY_MS),
          );
        }
      } catch (error) {
        console.error(`Error syncing category ${category}:`, error.message);
      }
    }

    console.log(`External news sync completed. Total synced: ${totalSynced}`);
    return {
      success: true,
      message: `Successfully synced ${totalSynced} external news articles`,
      totalSynced,
    };
  } catch (error) {
    console.error("Error in syncExternalNews:", error);
    throw error;
  }
};

// Get external news for a specific category
exports.getExternalNews = async (req, res) => {
  try {
    const { category } = req.params;

    if (!CATEGORY_MAPPING[category]) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const posts = await Post.find({
      isExternal: true,
      category: category,
      status: "published",
    })
      .populate("author", "username firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    res.json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error fetching external news:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching external news",
      error: error.message,
    });
  }
};

// Get all external news grouped by category
exports.getAllExternalNews = async (req, res) => {
  try {
    const categories = Object.keys(CATEGORY_MAPPING);
    const newsByCategory = {};

    for (const category of categories) {
      const posts = await Post.find({
        isExternal: true,
        category: category,
        status: "published",
      })
        .populate("author", "username firstName lastName profileImage")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();

      newsByCategory[category] = posts;
    }

    res.json({
      success: true,
      data: newsByCategory,
    });
  } catch (error) {
    console.error("Error fetching all external news:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching external news",
      error: error.message,
    });
  }
};
