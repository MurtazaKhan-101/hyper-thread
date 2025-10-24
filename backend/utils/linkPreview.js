const axios = require("axios");
const cheerio = require("cheerio");

class LinkPreviewService {
  async generateLinkPreview(url) {
    try {
      // Validate URL
      if (!url || !/^https?:\/\/.+/.test(url)) {
        throw new Error("Invalid URL");
      }

      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract title
      let title =
        $('meta[property="og:title"]').attr("content") ||
        $('meta[name="twitter:title"]').attr("content") ||
        $("title").text() ||
        "";

      // Extract description
      let description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="twitter:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "";

      // Extract thumbnail/image
      let thumbnail =
        $('meta[property="og:image"]').attr("content") ||
        $('meta[name="twitter:image"]').attr("content") ||
        $('link[rel="image_src"]').attr("href") ||
        "";

      // Clean and validate thumbnail URL
      if (thumbnail) {
        if (thumbnail.startsWith("//")) {
          thumbnail = "https:" + thumbnail;
        } else if (thumbnail.startsWith("/")) {
          const baseUrl = new URL(url);
          thumbnail = baseUrl.origin + thumbnail;
        } else if (!thumbnail.startsWith("http")) {
          thumbnail = "";
        }
      }

      // Clean title and description
      title = title.trim().substring(0, 200);
      description = description.trim().substring(0, 500);

      return {
        success: true,
        data: {
          title: title || "No title available",
          description: description || "No description available",
          thumbnail: thumbnail || null,
          url: url,
        },
      };
    } catch (error) {
      console.error("Error generating link preview:", error.message);
      return {
        success: false,
        error: error.message,
        data: {
          title: "Link Preview Unavailable",
          description: "Could not fetch preview for this link",
          thumbnail: null,
          url: url,
        },
      };
    }
  }
}

module.exports = new LinkPreviewService();
