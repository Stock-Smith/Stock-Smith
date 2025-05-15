/**
 * Holding Routes
 * This file defines all routes related to user stock holdings management
 * All routes use authentication middleware to verify user identity
 */
const express = require('express');
const router = express.Router();

const { getHoldings, addHolding, updateHoldingQuantity, updateHoldingInvestedPrice, updateHoldingPurchaseDate, deleteHolding } = require('../controllers/holding');
const auth = require('../middleware/authentication');

/**
 * @route   GET /
 * @desc    Get all holdings for authenticated user
 * @access  Private
 */
router.get('/', auth, getHoldings);

/**
 * @route   POST /add-holding
 * @desc    Add a new stock holding to user portfolio
 * @access  Private
 */
router.post('/add-holding', auth, addHolding);

/**
 * @route   PATCH /update-holding-quantity
 * @desc    Update quantity of an existing stock holding
 * @access  Private
 */
router.patch('/update-holding-quantity', auth, updateHoldingQuantity);

/**
 * @route   PATCH /update-holding-invested-price
 * @desc    Update invested price of an existing stock holding
 * @access  Private
 */
router.patch('/update-holding-invested-price', auth, updateHoldingInvestedPrice);

/**
 * @route   PATCH /update-holding-purchase-date
 * @desc    Update purchase date of an existing stock holding
 * @access  Private
 */
router.patch('/update-holding-purchase-date', auth, updateHoldingPurchaseDate);

/**
 * @route   DELETE /delete-holding
 * @desc    Remove a stock holding from user portfolio
 * @access  Private
 */
router.delete('/delete-holding', auth, deleteHolding);

module.exports = router;