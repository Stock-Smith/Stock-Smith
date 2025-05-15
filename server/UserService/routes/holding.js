const express = require('express');
const router = express.Router();

const { getHoldings, addHolding, updateHoldingQuantity } = require('../controllers/holding');
const auth = require('../middleware/authentication');

// Route to get all holdings for a user
router.get('/', auth, getHoldings);
router.post('/add-holding', auth, addHolding);
router.patch('/update-holding-quantity', auth, updateHoldingQuantity);

module.exports = router;