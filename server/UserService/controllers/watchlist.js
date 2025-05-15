const Watchlist = require("../models/Watchlist");
const { UnauthenticatedError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

/**
 * Controller class for managing user watchlists
 * Provides functionality to create, read, update, and delete watchlists and their stocks
 */
class WatchlistController {
  
  /**
   * Creates a new watchlist for a user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing watchlist data
   * @param {string} req.body.name - Name of the watchlist (required)
   * @param {string} [req.body.description] - Description of the watchlist
   * @param {Array<string>} [req.body.stocksSymbols] - Array of stock symbols to add to the watchlist
   * @param {Object} req.headers - Request headers
   * @param {string} req.headers.x-user-id - User ID from authentication middleware
   * @param {Object} res - Express response object
   * @returns {Object} Response with status and message
   * @throws {UnauthenticatedError} If user is not authenticated
   */
  async createWatchList(req, res) {
    const { name, description, stocksSymbols } = req.body;
    const userID = req.headers["x-user-id"];
    if (!userID) {
      throw new UnauthenticatedError("User not authenticated");
    }
    if (!name) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: name of watchlist" });
    }
    const watchlist = new Watchlist({
      userId: userID,
      name: name,
      description: description || "",
      stocksSymbols: stocksSymbols || [],
    });
    await watchlist.save();
    if (!watchlist) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to create watchlist" });
    }
    console.log(
      "Creating watchlist with data:",
      name,
      description,
      stocksSymbols
    );
    res
      .status(StatusCodes.CREATED)
      .json({ message: "Watchlist created successfully" });
  }

  /**
   * Adds stocks to an existing watchlist
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body containing data
   * @param {string} req.body.watchlistId - ID of the watchlist to add stocks to
   * @param {Array<string>} req.body.stocksSymbols - Array of stock symbols to add
   * @param {Object} req.headers - Request headers
   * @param {string} req.headers.x-user-id - User ID from authentication middleware
   * @param {Object} res - Express response object
   * @returns {Object} Response with status and message
   * @throws {UnauthenticatedError} If user is not authenticated
   */
  async addToWatchList(req, res) {
    const { watchlistId, stocksSymbols } = req.body;
    const userID = req.headers["x-user-id"];
    if (!userID) {
      throw new UnauthenticatedError("User not authenticated");
    }
    if (!watchlistId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: watchlistId" });
    }
    if (!stocksSymbols) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: stocksSymbols" });
    }
    const watchlist = await Watchlist.findById(watchlistId);
    if (!watchlist) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Watchlist not found" });
    }
    if (watchlist.userId.toString() !== userID) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }

    // Check if stocksSymbols is an array
    if (!Array.isArray(stocksSymbols)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "stocksSymbols should be an array" });
    }
    // Check if stocksSymbols is empty
    if (stocksSymbols.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "stocksSymbols should not be empty" });
    }
    // Add to watchlist
    stocksSymbols.forEach((stock) => {
      if (!watchlist.stocksSymbols.includes(stock.trim().toUpperCase())) {
        watchlist.stocksSymbols.push(stock);
      }
    });
    await watchlist.save();
    if (!watchlist) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to add stocks to watchlist" });
    }
    console.log(
      "Adding stocks to watchlist with data:",
      watchlistId,
      stocksSymbols
    );
    res
      .status(StatusCodes.OK)
      .json({ message: "Stocks added to watchlist successfully" });
  }

  /**
   * Retrieves all watchlists belonging to a user
   * @param {Object} req - Express request object
   * @param {Object} req.headers - Request headers
   * @param {string} req.headers.x-user-id - User ID from authentication middleware
   * @param {Object} res - Express response object
   * @returns {Object} Response with status and watchlists data
   * @throws {UnauthenticatedError} If user is not authenticated
   */
  async getWatchlists(req, res) {
    const userID = req.headers["x-user-id"];
    if (!userID) {
      throw new UnauthenticatedError("User not authenticated");
    }
    const watchlists = await Watchlist.find({ userId: userID });
    if (!watchlists) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No watchlists found" });
    }
    console.log("Getting watchlists for user with ID:", userID);
    res.status(StatusCodes.OK).json({ watchlists });
  }

  /**
   * Deletes a watchlist by ID
   * @param {Object} req - Express request object
   * @param {Object} req.query - Request query parameters
   * @param {string} req.query.watchlistID - ID of the watchlist to delete
   * @param {Object} req.headers - Request headers
   * @param {string} req.headers.x-user-id - User ID from authentication middleware
   * @param {Object} res - Express response object
   * @returns {Object} Response with status and message
   * @throws {UnauthenticatedError} If user is not authenticated
   */
  async deleteWatchlist(req, res) {
    const { watchlistID } = req.query;
    const userID = req.headers["x-user-id"];
    if (!userID) {
      throw new UnauthenticatedError("User not authenticated");
    }
    if (!watchlistID) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: watchlistID" });
    }
    const watchlist = await Watchlist.findById(watchlistID);
    if (!watchlist) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Watchlist not found" });
    }
    if (watchlist.userId.toString() !== userID) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    await Watchlist.findByIdAndDelete(watchlistID);
    console.log("Deleting watchlist with ID:", watchlistID);
    res
      .status(StatusCodes.OK)
      .json({ message: "Watchlist deleted successfully" });
  }

  /**
   * Removes a stock from a watchlist
   * @param {Object} req - Express request object
   * @param {Object} req.query - Request query parameters
   * @param {string} req.query.watchlistID - ID of the watchlist
   * @param {string} req.query.stockSymbol - Symbol of the stock to remove
   * @param {Object} req.headers - Request headers
   * @param {string} req.headers.x-user-id - User ID from authentication middleware
   * @param {Object} res - Express response object
   * @returns {Object} Response with status and message
   * @throws {UnauthenticatedError} If user is not authenticated
   */
  async deleteStockFromWatchlist(req, res) {
    const { watchlistID, stockSymbol } = req.query;
    const userID = req.headers["x-user-id"];
    if (!userID) {
      throw new UnauthenticatedError("User not authenticated");
    }
    if (!watchlistID) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: watchlistID" });
    }
    if (!stockSymbol) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing required field: stockSymbol" });
    }
    const watchlist = await Watchlist.findById(watchlistID);
    if (!watchlist) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Watchlist not found" });
    }
    if (watchlist.userId.toString() !== userID) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    const stockIndex = watchlist.stocksSymbols.indexOf(stockSymbol.trim().toUpperCase());
    if (stockIndex === -1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Stock not found in watchlist" });
    }
    watchlist.stocksSymbols.splice(stockIndex, 1);
    await watchlist.save();
    if (!watchlist) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Failed to delete stock from watchlist" });
    }
    console.log(
      "Deleting stock from watchlist with ID:",
      watchlistID,
      "and stock symbol:",
      stockSymbol
    );
    res
      .status(StatusCodes.OK)
      .json({ message: "Stock deleted from watchlist successfully" });
  }
}

module.exports = new WatchlistController();
