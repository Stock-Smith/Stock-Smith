"use strict";
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    tiingoApiKey: process.env.TIINGO_API_KEY,
    finnhubApiKey: process.env.FINNHUB_API_KEY
}