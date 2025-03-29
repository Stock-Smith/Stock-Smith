require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    db: {
        localUri: process.env.MONGO_DB_URI,
        atlasUri: process.env.MONGO_DB_ATLAS_URI,
    },
    polygonApiKey: process.env.POLYGON_API_KEY,
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
    finnhubApiKey: process.env.FINNHUB_API_KEY,
    newsURI: process.env.ALPHA_VANTAGE_NEWS_URI,
}