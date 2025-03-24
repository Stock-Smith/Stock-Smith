require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
    port: process.env.PORT || 3000,
    db: {
        localUri: process.env.MONGO_DB_URI,
        atlasUri: process.env.MONGO_DB_ATLAS_URI,
    },
    razorpayKeyID: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_SECRET_KEY,
    kafkaBrokers: isProduction
        ? process.env.KAFKA_BROKERS_PROD
        : process.env.KAFKA_BROKERS_DEV,
}