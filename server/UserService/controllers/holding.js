const { StatusCodes } = require("http-status-codes");
const Holding = require('../models/Holding');
const {BadRequestError, UnauthenticatedError} = require('../errors');

const getHoldings = async (req, res) => {
    console.log("Fetching holdings");
    const userId = req.headers['x-user-id'];
    if (!userId) {
        throw new UnauthenticatedError("User not authenticated");
    }
    const holdings = await Holding.find({ userId });
    if(!holdings) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "No holdings found" });
    }
    res.status(StatusCodes.OK).json(holdings);
}

const addHolding = async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        throw new UnauthenticatedError("User not authenticated");
    }
    let { ticker, investedPrice, investedQuantity, currentQuantity, purchaseDate } = req.body;
    if(!ticker || !investedPrice || !investedQuantity || !purchaseDate) {
        throw new BadRequestError("Please provide all values");
    }
    if(!currentQuantity) {
        currentQuantity = investedQuantity;
    }
    
    const purchaseDateObj = new Date(purchaseDate);
    if (isNaN(purchaseDateObj.getTime())) {
        throw new BadRequestError("Invalid purchase date");
    }

    const existingHolding = await Holding.findOne({ userId, "holdings.ticker": ticker.toUpperCase() });
    if(existingHolding) {
        throw new BadRequestError("Holding already exists");
    }

    const holding = new Holding({
        userId,
        holdings: [{
            ticker: ticker.toUpperCase(),
            investedPrice,
            investedQuantity,
            currentQuantity,
            purchaseDate: purchaseDateObj
        }]
    });
    await holding.save();
    res.status(StatusCodes.CREATED).json({ message: "Holding added successfully" });
}

module.exports = {
    getHoldings,
    addHolding
}