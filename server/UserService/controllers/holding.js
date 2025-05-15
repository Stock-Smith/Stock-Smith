const { StatusCodes } = require("http-status-codes");
const Holding = require('../models/Holding');
const {BadRequestError, UnauthenticatedError} = require('../errors');

/**
 * Get all holdings for a specific user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user's holdings or error
 * @throws {UnauthenticatedError} When user is not authenticated
 */
const getHoldings = async (req, res) => {
    console.log("Fetching holdings");
    // const userId = req.headers['x-user-id'];
    const userId = req.userId;
    if (!userId) {
        throw new UnauthenticatedError("User not authenticated");
    }
    const holdings = await Holding.find({ userId });
    if(!holdings) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "No holdings found" });
    }
    res.status(StatusCodes.OK).json(holdings);
}

/**
 * Add a new holding for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the newly added holding or error
 * @throws {BadRequestError} When required fields are missing or invalid
 */
const addHolding = async (req, res) => {
    const userId = req.userId;
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

    // check if there is holding of user
    const holding = await Holding.findOne({ userId });

    if(holding) {
        holding.holdings.push({
            ticker: ticker.toUpperCase(),
            investedPrice,
            investedQuantity,
            currentQuantity,
            purchaseDate: purchaseDateObj
        });
        await holding.save();
        return res.status(StatusCodes.OK).json({ holding, message: "Holding added successfully" });
    }

    // if no holding exists, create a new holding
    const newHolding = new Holding({
        userId,
        holdings: [{
            ticker: ticker.toUpperCase(),
            investedPrice,
            investedQuantity,
            currentQuantity,
            purchaseDate: purchaseDateObj
        }]
    });
    await newHolding.save();

    res.status(StatusCodes.CREATED).json({ holding: newHolding, message: "Holding added successfully" });
}

/**
 * Update the current quantity of a specific holding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated holding or error
 * @throws {BadRequestError} When holdingId or currentQuantity is missing, or holding not found
 * @throws {UnauthenticatedError} When user is not authorized to update the holding
 */
const updateHoldingQuantity = async (req, res) => {
    console.log("Updating holding quantity");
    
    const userId = req.userId;
    const { holdingId } = req.query;
    const { currentQuantity, ticker } = req.body;

    if (!holdingId) {
        throw new BadRequestError("Please provide holdingId");
    }

    if (!currentQuantity || !ticker) {
        throw new BadRequestError("Please provide all the required fields!");
    }

    const holding = await Holding.findById(holdingId);
    if (!holding) {
        throw new BadRequestError("Holding not found");
    }

    if(holding.userId.toString() !== userId) {
        throw new UnauthenticatedError("User not authorized");
    }

    const holdingIndex = holding.holdings.findIndex(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    if (holdingIndex === -1) {
        throw new BadRequestError("Holding not found");
    }

    if(currentQuantity > holding.holdings[holdingIndex].investedQuantity) {
        throw new BadRequestError("Current quantity cannot be greater than invested quantity");
    }
    if(currentQuantity < 0) {
        throw new BadRequestError("Current quantity cannot be negative");
    }

    holding.holdings[holdingIndex].currentQuantity = currentQuantity;
    holding.holdings[holdingIndex].lastUpdated = Date.now();
    await holding.save();
    res.status(StatusCodes.OK).json({ holding, message: "Holding updated successfully" });
}

/**
 * Update the invested price of a specific holding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated holding or error
 * @throws {BadRequestError} When required fields are missing or invalid
 * @throws {UnauthenticatedError} When user is not authorized to update the holding
 */
const updateHoldingInvestedPrice = async (req, res) => {
    const userId = req.userId;
    const { holdingId } = req.query;
    const { investedPrice, ticker } = req.body;
    if (!holdingId) {
        throw new BadRequestError("Please provide holdingId");
    }
    if (!investedPrice || !ticker) {
        throw new BadRequestError("Please provide all the required fields!");
    }
    const holding = await Holding.findById(holdingId);
    if (!holding) {
        throw new BadRequestError("Holding not found");
    }
    if(holding.userId.toString() !== userId) {
        throw new UnauthenticatedError("User not authorized");
    }
    const holdingIndex = holding.holdings.findIndex(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    if (holdingIndex === -1) {
        throw new BadRequestError("Holding not found");
    }
    holding.holdings[holdingIndex].investedPrice = investedPrice;
    holding.holdings[holdingIndex].lastUpdated = Date.now();
    await holding.save();
    res.status(StatusCodes.OK).json({ holding, message: "Holding updated successfully" });

}

const updateHoldingPurchaseDate = async (req, res) => {
    const userId = req.userId;
    const { holdingId } = req.query;
    const { purchaseDate, ticker } = req.body;
    if (!holdingId) {
        throw new BadRequestError("Please provide holdingId");
    }
    if (!purchaseDate || !ticker) {
        throw new BadRequestError("Please provide all the required fields!");
    }
    const holding = await Holding.findById(holdingId);
    if (!holding) {
        throw new BadRequestError("Holding not found");
    }
    if(holding.userId.toString() !== userId) {
        throw new UnauthenticatedError("User not authorized");
    }
    const holdingIndex = holding.holdings.findIndex(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    if (holdingIndex === -1) {
        throw new BadRequestError("Holding not found");
    }
    const purchaseDateObj = new Date(purchaseDate);
    if (isNaN(purchaseDateObj.getTime())) {
        throw new BadRequestError("Invalid purchase date");
    }
    holding.holdings[holdingIndex].purchaseDate = purchaseDateObj;
    holding.holdings[holdingIndex].lastUpdated = Date.now();
    await holding.save();
    res.status(StatusCodes.OK).json({ holding, message: "Holding updated successfully" });
}

/**
 * Delete a specific holding from a user's portfolio
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with the updated portfolio or success message
 * @throws {BadRequestError} When portfolioId or holdingId is missing, or holding not found
 * @throws {UnauthenticatedError} When user is not authorized to delete the holding
 */
const deleteHolding = async (req, res) => {
    const userId = req.userId;
    const { portfolioId, holdingId } = req.query;
    if (!holdingId || !portfolioId) {
        throw new BadRequestError("Please provide holdingId and portfolioId");
    }
    const portfolio = await Holding.findById(portfolioId);
    
    if (!portfolio) {
        throw new BadRequestError("Holding not found");
    }
    if(portfolio.userId.toString() !== userId) {
        throw new UnauthenticatedError("User not authorized");
    }
    // check if holding has any holdings
    // I want to delete from the holdings array
    const holdingIndex = portfolio.holdings.findIndex(h => h._id.toString() === holdingId);
    if (holdingIndex === -1) {
        throw new BadRequestError("Holding not found");
    }

    // remove holding from the holdings array
    portfolio.holdings.splice(holdingIndex, 1);
    await portfolio.save();
    if (portfolio.holdings.length === 0) {
        await Holding.deleteOne({ _id: portfolioId });
        return res.status(StatusCodes.OK).json({ message: "Holding deleted successfully" });
    }
    return res.status(StatusCodes.OK).json({ portfolio, message: "Holding deleted successfully" });
}

module.exports = {
    getHoldings,
    addHolding,
    updateHoldingQuantity,
    updateHoldingInvestedPrice,
    updateHoldingPurchaseDate,
    deleteHolding
}