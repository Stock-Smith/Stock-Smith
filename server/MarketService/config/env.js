require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    finnhubApiKey: process.env.FINNHUB_API_KEY,
    finnhubBaseURL: process.env.FINNHUB_API_BASE_URL,
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
    alphaVantageBaseURL: process.env.ALPHA_VANTAGE_BASE_URI,
}