const mongoose = require("mongoose");

const trendingKeywordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      minlength: 2,
      maxlength: 60,
    },
    boost: {
      type: Number,
      default: 25,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

trendingKeywordSchema.index({ isActive: 1 });

const TrendingKeyword = mongoose.model("TrendingKeyword", trendingKeywordSchema);

module.exports = TrendingKeyword;
