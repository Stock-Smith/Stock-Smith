const express = require('express');
const router = express.Router();

const WatchlistController = require('../controllers/watchlist');

router.post('/create-watchlist', WatchlistController.createWatchList);
router.post('/add-to-watchlist', WatchlistController.addToWatchList);
router.get('/get-watchlist', WatchlistController.getWatchlists);
router.delete('/delete-watchlist', WatchlistController.deleteWatchlist);
router.delete('/delete-stock', WatchlistController.deleteStockFromWatchlist);


module.exports = router;