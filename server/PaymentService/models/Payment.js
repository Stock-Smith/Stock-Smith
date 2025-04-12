const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderId: {
        type: String,
        required: true,
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true // This field is optional, so we use sparse to allow multiple documents with null values
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        required: true,
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, { timestamps: true});

const payment = mongoose.model('Payment', PaymentSchema);
module.exports = payment;