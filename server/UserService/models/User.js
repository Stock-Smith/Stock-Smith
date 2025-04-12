const mongoose = require('mongoose');

const UserSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    subscriptionType: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free',
    },
    subscription: {
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        currentPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPlan'
        }
    }
}, {
    timestamps: true
});

const UserSubscription = mongoose.model('UserSubscription', UserSubscriptionSchema);
module.exports = UserSubscription;