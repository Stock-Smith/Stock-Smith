"use strict";
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    db: {
        localUri: process.env.MONGO_DB_URI,
        atlasUri: process.env.MONGO_DB_ATLAS_URI,
    },
    razorpayKeyID: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_SECRET_KEY,
}