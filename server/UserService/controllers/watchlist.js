const Watchlist = require('../models/Watchlist');
const { UnauthenticatedError} = require('../errors');
const { StatusCodes } = require("http-status-codes");

class WatchlistController {

    async createWatchList(req, res) {
        const {name, description, stocksSymbols} = req.body;
        const userID = req.headers["x-user-id"];
        if (!userID) {
            throw new UnauthenticatedError("User not authenticated");
        }
        if(!name) {
            return res.status(StatusCodes.BAD_REQUEST).json({message: "Missing required field: name of watchlist"});
        }
        const watchlist = new Watchlist({
            userId: userID,
            name: name,
            description: description || "",
            stocksSymbols: stocksSymbols || []
        });
        await watchlist.save();
        if (!watchlist) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Failed to create watchlist"});
        }
        console.log("Creating watchlist with data:", name, description, stocksSymbols);
        res.status(StatusCodes.CREATED).json({message: "Watchlist created successfully"});
    }

    async addToWatchList(req, res) {
        const {watchlistId, stocksSymbols} = req.body;
        const userID = req.headers["x-user-id"];
        if (!userID) {
            throw new UnauthenticatedError("User not authenticated");
        }
        if(!watchlistId) {
            return res.status(StatusCodes.BAD_REQUEST).json({message: "Missing required field: watchlistId"});
        }
        if(!stocksSymbols) {
            return res.status(StatusCodes.BAD_REQUEST).json({message: "Missing required field: stocksSymbols"});
        }
        const watchlist = await Watchlist.findById(watchlistId);
        if (!watchlist) {
            return res.status(StatusCodes.NOT_FOUND).json({message: "Watchlist not found"});
        }
        if (watchlist.userId.toString() !== userID) {
            return res.status(StatusCodes.UNAUTHORIZED).json({message: "Unauthorized"});
        }

        // Check if stocksSymbols is an array
        if (!Array.isArray(stocksSymbols)) {
            return res.status(StatusCodes.BAD_REQUEST).json({message: "stocksSymbols should be an array"});
        }
        // Check if stocksSymbols is empty
        if (stocksSymbols.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({message: "stocksSymbols should not be empty"});
        }
        // Add to watchlist 
        stocksSymbols.forEach(stock => {
            if (!watchlist.stocksSymbols.includes(stock.trim().toUpperCase())) {
                watchlist.stocksSymbols.push(stock);
            }
        });
        await watchlist.save();
        if (!watchlist) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: "Failed to add stocks to watchlist"});
        }
        console.log("Adding stocks to watchlist with data:", watchlistId, stocksSymbols);
        res.status(StatusCodes.OK).json({message: "Stocks added to watchlist successfully"});
    }

    async getWatchlists(req, res) {
        const userID = req.headers["x-user-id"];
        if (!userID) {
            throw new UnauthenticatedError("User not authenticated");
        }
        const watchlists = await Watchlist.find({userId: userID});
        if (!watchlists) {
            return res.status(StatusCodes.NOT_FOUND).json({message: "No watchlists found"});
        }
        console.log("Getting watchlists for user with ID:", userID);
        res.status(StatusCodes.OK).json({watchlists});
    }
}

module.exports = new WatchlistController();