const express = require('express');
const router = express.Router();

const MarketController = require('../controllers/market-controller');

router.get('/status', MarketController.getMarketStatus);
router.get('/holidays', MarketController.getMarketHolidays);

module.exports = router;