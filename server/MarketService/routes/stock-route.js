const express = require('express');
const router = express.Router();

const StockController = require('../controllers/stock-controller');

router.get('/details', StockController.getStockMetaData);

module.exports = router;