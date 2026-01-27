const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const { Post } = require("../models/Posts");
const User = require("../models/User");
const mongoose = require("mongoose");

// Category mapping: app categories to NewsAPI categories
const CATEGORY_MAPPING = {
  politics: "general",
  business: "business",
  entertainment: "entertainment",
  lifestyle: "health",
  technology: "technology",
  community: "general",
};

// Get or create the system user for external news posts
const getSystemUser = async () => {
  try {
    let systemUser = await User.findOne({ username: "newsaggregator" });

    if (!systemUser) {
      systemUser = await User.create({
        username: "newsaggregator",
        email: "newsaggregator@newsnatter.com",
        password: "N0tR3@lP@ssw0rd!ExternalNewsOnly",
        firstName: "News",
        lastName: "Aggregator",
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

// Fetch news for a specific category from NewsAPI
const fetchCategoryNews = async (appCategory, limit = 3) => {
  try {
    const newsApiCategory = CATEGORY_MAPPING[appCategory];
    if (!newsApiCategory) {
      console.log(`No mapping found for category: ${appCategory}`);
      return [];
    }

    const response = await newsapi.v2.topHeadlines({
      category: newsApiCategory,
      language: "en",
      country: "us",
      pageSize: limit,
    });

    if (response.status === "ok" && response.articles) {
      return response.articles;
    }

    return [];
  } catch (error) {
    console.error(
      `Error fetching news for category ${appCategory}:`,
      error.message
    );
    return [];
  }
};

// Convert NewsAPI article to Post format
const convertArticleToPost = (article, category, systemUserId) => {
  return {
    postType: "link",
    title: article.title || "Untitled News Article",
    content: article.description || "",
    author: systemUserId,
    category: category,
    linkUrl: article.url,
    linkThumbnail: article.urlToImage || null,
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
          `Deleted ${deleteResult.deletedCount} old external posts for ${category}`
        );

        // Fetch new articles
        const articles = await fetchCategoryNews(category, 3);
        console.log(`Fetched ${articles.length} articles for ${category}`);

        // Convert and save new posts
        const posts = articles.map((article) =>
          convertArticleToPost(article, category, systemUser._id)
        );

        if (posts.length > 0) {
          await Post.insertMany(posts);
          totalSynced += posts.length;
          console.log(`Saved ${posts.length} external posts for ${category}`);
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
