/**
 * Express router for watchlist operations
 * This module handles all watchlist-related routes including creating watchlists,
 * adding stocks to watchlists, retrieving watchlists, and deleting watchlists or stocks.
 * @module routes/watchlist
 */
const express = require('express');
const router = express.Router();

const WatchlistController = require('../controllers/watchlist');

/**
 * @route POST /create-watchlist
 * @description Create a new watchlist for a user
 * @access Private
 */
router.post('/create-watchlist', WatchlistController.createWatchList);

/**
 * @route POST /add-to-watchlist
 * @description Add a stock symbol to a user's watchlist
 * @access Private
 */
router.post('/add-to-watchlist', WatchlistController.addToWatchList);

/**
 * @route GET /get-watchlist
 * @description Get all watchlists for the authenticated user
 * @access Private
 */
router.get('/get-watchlist', WatchlistController.getWatchlists);

/**
 * @route DELETE /delete-watchlist
 * @description Delete a specific watchlist
 * @access Private
 */
router.delete('/delete-watchlist', WatchlistController.deleteWatchlist);

/**
 * @route DELETE /delete-stock
 * @description Remove a stock from a watchlist
 * @access Private
 */
router.delete('/delete-stock', WatchlistController.deleteStockFromWatchlist);


module.exports = router;