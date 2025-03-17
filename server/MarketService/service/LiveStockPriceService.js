const WebSocket = require("ws");
const config = require("../config/env");
const { CustomAPIError } = require("../errors");

/**
 * Service for fetching real-time stock prices from Tiingo via WebSocket
 */
class LiveStockPriceService {
  constructor() {
    this.ws = null;
    this.subscriptionID = null;
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
   * Handle incoming messages from Tiingo WebSocket API
   * @param {string} message - The parsed message from Tiingo
   */
  handleMessage(message) {
    const data = JSON.parse(message);
    if(data.messageType == "I") {
        this.subscriptionID = data.data.subscriptionId;
    }
    console.log("Parsed message:", data);
  }

  /**
   * Subscribe to stock ticker(s)
   * @param {string|string[]} tickers - Single ticker or array of tickers to subscribe to
   */
  subscribe(tickers) {
    if(!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket connection is not open");
        throw new CustomAPIError("WebSocket connection is not open");
    }

    const tickerList = Array.isArray(tickers) ? tickers : [tickers];

    tickerList.forEach(ticker => {
        this.subscriptions.add(ticker);
    });

    const subscribeMessage = {
        eventName: "subscribe",
        authorization: config.tiingoApiKey,
        eventData: {
            tickers: Array.from(this.subscriptions),
        },
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    console.log(`Subscribed to tickers: ${Array.from(this.subscriptions).join(', ')}`);

  }
}

module.exports = new LiveStockPriceService();

