require('dotenv').config();
const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
    port: process.env.PORT || 3000,
    db: {
        localUri: process.env.MONGO_DB_URI,
        atlasUri: process.env.MONGO_DB_ATLAS_URI,
    },
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    emailUser: process.env.EMAIL_USER,
    emailPass: process.env.EMAIL_PASS,
    clientURI: process.env.CLIENT_URI,
    kafkaBrokers: isProduction
        ? process.env.KAFKA_BROKERS_PROD
        : process.env.KAFKA_BROKERS_DEV,
    kafkaPaymentTopic: process.env.KAFKA_PAYMENT_TOPIC,
    kafkaPredictionTopic: process.env.KAFKA_PREDICTION_TOPIC
}