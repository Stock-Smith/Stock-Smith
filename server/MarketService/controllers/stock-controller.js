const { StatusCodes } = require("http-status-codes");
const StockService = require('../service/StockService');

class StockController {
    /**
     * Get stock meta data for a specific stock ticker
     * @route GET /api/stock/meta
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getStockMetaData(req, res) {
        const { ticker } = req.query;
        const stockMetaData = await StockService.getStockMetaData(ticker);
        res.status(StatusCodes.OK).json(stockMetaData);
    }
}

module.exports = new StockController();