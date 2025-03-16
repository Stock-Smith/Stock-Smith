const { default: axios } = require("axios");
const https = require("https");
const config = require("../config/env");
const { BadRequestError, InternalServerError } = require("../errors");

class MarketService {
  constructor() {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Bypass SSL certificate validation - only for development
    });
  }

  /**
   * Creates a configured axios instance with error handling
   * @private
   * @returns {Object} - Configured axios instance
   */
  _createAxiosInstance() {
    const instance = axios.create({
      baseURL: config.finnhubBaseURL,
      httpsAgent: this.httpsAgent,
      timeout: 10000, 
    });

    return instance;
  }

  /**
   * Fetches the market status for a given exchange.
   * @async
   * @function
   * @param {string} exchange - The exchange market (e.g., "US").
   * @returns {Promise<Object>} - A promise that resolves to the market status data.
   * @throws {BadRequestError} - Throws if exchange parameter is missing.
   * @throws {InternalServerError} - Throws if API request fails.
   */
  async getMarketStatus(exchange) {
    if (!exchange) {
      throw new BadRequestError("Missing required parameter: exchange");
    }
    
    try {
      const client = this._createAxiosInstance();
      const response = await client.get("/stock/market-status", {
        params: {
          exchange,
          token: config.finnhubApiKey,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching market status:", error.message);
      
      // More specific error handling
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        if (error.response.status === 401) {
          throw new InternalServerError("Invalid API key");
        }
      }
      
      throw new InternalServerError("Error fetching market status");
    }
  }

  /**
   * Fetches market holidays for a given exchange.
   * @async
   * @function
   * @param {string} exchange - The exchange market (e.g., "US").
   * @returns {Promise<Object>} - A promise that resolves to the market holidays data.
   * @throws {BadRequestError} - Throws if exchange parameter is missing.
   * @throws {InternalServerError} - Throws if API request fails.
   */
  async getMarketHolidays(exchange) {
    if (!exchange) {
      throw new BadRequestError("Missing required parameter: exchange");
    }
    
    try {
      const client = this._createAxiosInstance();
      const response = await client.get("/stock/market-holiday", {
        params: {
          exchange,
          token: config.finnhubApiKey,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error("Error fetching market holidays:", error.message);
      
      if (error.response) {
        console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        if (error.response.status === 401) {
          throw new InternalServerError("Invalid API key");
        }
      }
      
      throw new InternalServerError("Error fetching market holidays");
    }
  }
}

module.exports = new MarketService();