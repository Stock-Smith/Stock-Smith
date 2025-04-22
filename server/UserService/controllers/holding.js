const Holding = require('../models/Holding');
const { StatusCodes } = require("http-status-codes");
const {BadRequestError, UnauthenticatedError} = require('../errors');

const getHoldings = async (req, res) => {
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
    const { ticker, investedPrice, investedQuantity, currentQuantity, purchaseDate } = req.body;
    if(!ticker || !investedPrice || !investedQuantity) {
        throw new BadRequestError("Please provide all values");
    }
    if(!currentQuantity) {
        currentQuantity = investedQuantity;
    }
    
}