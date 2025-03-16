const { StatusCodes } = require("http-status-codes");
const MarketService = require('../service/MarketService');

class MarketController {
  /**
   * Get market status for a specific exchange
   * @route GET /api/market/status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
    async getMarketStatus(req, res) {
        const { exchange } = req.query;
        const marketStatus = await MarketService.getMarketStatus(exchange);
        res.status(StatusCodes.OK).json(marketStatus);
    }

    async getMarketHolidays(req, res) {
        const { exchange } = req.query;
        const marketHolidays = await MarketService.getMarketHolidays(exchange);
        res.status(StatusCodes.OK).json(marketHolidays);
    }
}

module.exports = new MarketController();