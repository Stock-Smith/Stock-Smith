"use strict";
const express = require('express');
const router = express.Router();

const {fetchMarketNews} = require('../controllers/news-fetch');

// router.get('/market-news/:ticker/:topic/:time_from/:time_to/:sort/:limit', fetchMarketNews);
// router.get('/market-news/finnhub', fetchNews);
router.get('/market-news', fetchMarketNews);

module.exports = router;