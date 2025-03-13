const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['free', 'premium'],
        required: true,
    },
    price: {
        amount: Number,
        currency: {
            type: String,
            default: 'INR',
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'annually'],
            required: true,
            default: 'monthly',
        }
    },
    features: {
        dailyPredictionLimit: {
            type: Number,
            required: true,
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {timestamps: true});

const subscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

module.exports = subscriptionPlan;