const mongoose = require("mongoose");

const HoldingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  holdings: [
    {
      ticker: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
      },
      investedPrice: {
        type: Number,
        required: true,
      },
      investedQuantity: {
        type: Number,
        required: true,
      },
      currentQuantity: {
        type: Number,
        required: true,
      },
      purchaseDate: {
        type: Date,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      performanceMetrics: {
        returnPercentage: Number,
        profitLoss: Number,
      }
    },
  ],
}, {timestamps: true});

HoldingSchema.index({ "holdings.ticker": 1 });
HoldingSchema.index({ userId: 1, "holdings.sector": 1 });

const Holding = mongoose.model("Holding", HoldingSchema);
module.exports = Holding;