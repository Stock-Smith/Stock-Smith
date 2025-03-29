const config = require("../config/env");
const axios = require("axios");
const { BadRequestError, InternalServerError } = require("../errors");

class StockService {
  /**
   * Creates a configured axios instance with error handling
   * @private
   * @returns {Object} - Configured axios instance
   */
  _createAxiosInstance() {
    const instance = axios.create({
      baseURL: config.alphaVantageBaseURL,
      timeout: 10000,
    });

    return instance;
  }

  /**
   * Fetches stock meta data for a given ticker.
   * @async
   * @function
   * @param {string} ticker - The stock ticker symbol.
   * @returns {Promise<Object>} - A promise that resolves to the stock meta data.
   * @throws {BadRequestError} - Throws if ticker parameter is missing.
   * @throws {InternalServerError} - Throws if API request fails.
   */
  async getStockMetaData(ticker) {
    if (!ticker) {
      throw new BadRequestError("Missing required parameter: ticker");
    }
    try {
      const client = this._createAxiosInstance();
      const response = await client.get("/query", {
        params: {
          function: "OVERVIEW",
          symbol: ticker,
          apikey: config.alphaVantageApiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching market status:", error.message);

      // More specific error handling
      if (error.response) {
        console.error(
          `Status: ${error.response.status}, Data:`,
          error.response.data
        );
        if (error.response.status === 401) {
          throw new InternalServerError("Invalid API key");
        }
      }

      throw new InternalServerError("Error fetching market status");
    }
  }
}

module.exports = new StockService();
