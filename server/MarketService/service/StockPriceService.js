const WebSocket = require("ws");
const { CustomAPIError } = require("../errors");
const config = require("../config/env");
const redisClient = require("../uitls/redis");

/**
 * Service for fetching real-time stock prices from Tiingo via WebSocket
 */
class StockPriceService {
  constructor() {
    this.ws = null;
    this.redisKey = "stock:subscription";
    this.stockPriceKey = "stock:price";
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
  }

  /**
   * Connect to Tiingo WebSocket API
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws) {
        this.ws.terminate();
      }

      this.ws = new WebSocket(config.tiingoWebSocketURI);

      this.ws.on("open", () => {
        console.log("Connected to Tiingo WebSocket API");
        this.reconnectAttempts = 0;
        this._authenticate();
        this._restoreSubscriptions();
        resolve();
      });

      this.ws.on("message", (data, flags) => {
        try {
          this.handleMessage(data);
        } catch (error) {
          console.error(
            "Error parsing message from Tiingo WebSocket API:",
            error
          );
        }
      });

      this.ws.on("close", () => {
        console.log("Connection closed");
      });

      this.ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      });
    });
  }

  /**
   * Authenticate with Tiingo WebSocket API
   */
  _authenticate() {
    const authMessage = {
      eventName: "subscribe",
      authorization: config.tiingoApiKey,
      eventData: {
        thresholdLevel: 6,
        tickers: [],
      },
    };
    this.ws.send(JSON.stringify(authMessage));
  }

  /**
   * Restore subscriptions from Redis after connection/reconnection
   */
  async _restoreSubscriptions() {
    try {
      const tickers = await redisClient.smembers(this.redisKey);
      if (tickers && tickers.length > 0) {
        const subscribeMessage = {
          eventName: "subscribe",
          authorization: config.tiingoApiKey,
          eventData: {
            tickers: tickers,
          },
        };
        this.ws.send(JSON.stringify(subscribeMessage));
        console.log(`Restored subscriptions: ${tickers.join(", ")}`);
      }
    } catch (error) {
      console.error("Error restoring subscriptions from Redis:", error);
      throw new CustomAPIError("Error restoring subscriptions from Redis");
    }
  }

  /**
   * Handle incoming messages from Tiingo WebSocket API
   * @param {string} message - The raw message from Tiingo
   */
  handleMessage(message) {
    const data = JSON.parse(message);
    console.log("Parsed message:", data);
    if(data.service === 'iex' && data.messageType === 'A') {
      const [timestamp, ticker, price] = data.data;
      console.log(`Received stock price for ${ticker} at ${timestamp}: $${price}`);
      const normalisedTicker = ticker.toUpperCase();
      const stockPrice = {
        timestamp,
        ticker: normalisedTicker,
        price,
      };
      redisClient.publish(`${this.stockPriceKey}:${normalisedTicker}`, JSON.stringify(stockPrice));
    }
  }

  /**
   * Subscribe to stock ticker(s)
   * @param {string|string[]} tickers - Single ticker or array of tickers to subscribe to
   */
  async subscribe(tickers) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open");
      throw new CustomAPIError("WebSocket connection is not open");
    }

    const tickerList = Array.isArray(tickers) ? tickers : [tickers];

    try {
      if (tickerList.length > 0) {
        await redisClient.sadd(this.redisKey, tickerList);
      }
      const allTickers = await redisClient.smembers(this.redisKey);
      const subscribeMessage = {
        eventName: "subscribe",
        authorization: config.tiingoApiKey,
        eventData: {
          tickers: allTickers,
        },
      };

      this.ws.send(JSON.stringify(subscribeMessage));
      console.log(`Subscribed to tickers: ${allTickers.join(", ")}`);
    } catch (error) {
      console.error("Error subscribing to tickers:", error);
      throw new CustomAPIError("Failed to subscribe to tickers");
    }
  }

  /**
   * Unsubscribe from stock ticker(s)
   * @param {string|string[]} tickers - Single ticker or array of tickers to unsubscribe from
   */
  async unsubscribe(tickers) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket connection is not open");
      throw new CustomAPIError("WebSocket connection is not open");
    }
    const tickerList = Array.isArray(tickers) ? tickers : [tickers];
    try {
      // Remove tickers from Redis
      if (tickerList.length > 0) {
        await redisClient.srem(this.redisKey, tickerList);
      }
      const unsubscribeMessage = {
        eventName: "unsubscribe",
        authorization: config.tiingoApiKey,
        eventData: {
          tickers: tickerList,
        },
      };

      this.ws.send(JSON.stringify(unsubscribeMessage));
      console.log(`Unsubscribed from tickers: ${tickerList.join(", ")}`);
    } catch (error) {
      console.error("Error unsubscribing from tickers:", error);
      throw new CustomAPIError("Failed to unsubscribe from tickers");
    }
  }

  /**
   * Ensure that a stock ticker is subscribed to
   * @param {string} ticker - The stock ticker to ensure subscription for
   * @returns {boolean} - Indicates whether a new subscription was made
   */
  async ensureSubscription(ticker) {
    // Check if ticker is already subscribed
    const isSubscribed = await redisClient.sismember(this.redisKey, ticker);
    
    // If not already subscribed, subscribe to it
    if (!isSubscribed) {
      await this.subscribe(ticker);
      return true; // Indicates a new subscription was made
    }
    
    return false; // Already subscribed
  }

  /**
   * Reset existing WebSocket connections
   */
  async resetConnections() {
    console.log("Cleaning up existing Tiingo WebSocket connections...");
    
    // Close the current WebSocket if it exists
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    
    console.log("Connection reset complete. Ready to establish new connections.");
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    await this.redis.quit();
  }
}

module.exports = new StockPriceService();
