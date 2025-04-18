const express = require('express');
const router = express.Router();

const WatchlistController = require('../controllers/watchlist');

router.post('/create-watchlist', WatchlistController.createWatchList);
router.post('/add-to-watchlist', WatchlistController.addToWatchList);
router.get('/get-watchlist', WatchlistController.getWatchlists);


module.exports = router;