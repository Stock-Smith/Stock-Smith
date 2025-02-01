const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      stockSymbol: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      purchasePrice: {
        type: Number,
        required: true,
      },
      purchaseDate: {
        type: Date,
        required: true,
      },
    },
    { timestamps: true }
  );

const holding = mongoose.model('Holding', HoldingSchema);
module.exports = holding;