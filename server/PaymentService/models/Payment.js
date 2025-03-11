const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
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
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer'],
        required: true
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