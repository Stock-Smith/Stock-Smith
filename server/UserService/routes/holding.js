const express = require('express');
const router = express.Router();

const { getHoldings, addHolding } = require('../controllers/holding');
const auth = require('../middleware/authentication');

// Route to get all holdings for a user
router.get('/', auth, getHoldings);
router.post('/add-holding', auth, addHolding);

module.exports = router;