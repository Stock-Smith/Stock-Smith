const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    stocksSymbols: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Watchlist = mongoose.model("Watchlist", WatchlistSchema);
module.exports = Watchlist;
