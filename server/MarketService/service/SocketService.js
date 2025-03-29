const socketIo = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

const StockPriceService = require("./StockPriceService");
const config = require("../config/env");

class SocketService {
  constructor(server) {
    console.log("Initializing Socket.IO service");

    // this.io = socketIo(server);
    this.io = socketIo(server, {
      cors: {
        origin: "*", // For development only
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });

    this.redisSub = new Redis({
      host: config.redis.host,
      port: config.redis.port,
    });

    const pubClient = this.redisClient.duplicate();
    const subClient = this.redisClient.duplicate();

    // Make sure subClient is properly initialized before using it
    this.io.adapter(createAdapter(pubClient, subClient));

    this.init();
  }

  async init() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("authenticate", async (clientId) => {
        await this.redisClient.set(`socket:${socket.id}`, clientId);
        await this.redisClient.set(`client:socket:${clientId}`, socket.id);
        console.log(
          `Client ${clientId} authenticated with socket ${socket.id}`
        );
        await this.restoreSubscriptions(socket.id, clientId);
      });

      socket.on("subscribe", async (tickers) => {
        const clientId = await this.redisClient.get(`socket:${socket.id}`);
        if (!clientId) {
          socket.emit("error", { message: "Please authenticate first" });
          return;
        }
        const tickerList = Array.isArray(tickers) ? tickers : [tickers];
        await this.subscribeClient(socket.id, clientId, tickerList);
      });

      socket.on("unsubscribe", async (tickers) => {
        const clientId = await this.redisClient.get(`socket:${socket.id}`);
        if (!clientId) {
          socket.emit("error", { message: "Please authenticate first" });
          return;
        }

        const tickerList = Array.isArray(tickers) ? tickers : [tickers];
        await this.unsubscribeClient(socket.id, clientId, tickerList);
      });

      socket.on("disconnect", async () => {
        await this.handleDisconnect(socket.id);
      });
    });
    await this.redisSub.psubscribe("stock:price:*");
    // this.redisSub.on("pmessage", (pattern, channel, message) => {
    //   const ticker = channel.split(":")[2];
    //   // console.log(`Redis message received for ${ticker}:`, message);
    //   this.io.to(`ticker:${ticker}`).emit("price", JSON.parse(message));
    // });
    this.redisSub.on("pmessage", (pattern, channel, message) => {
      const ticker = channel.split(":")[2].toUpperCase();

      // Debug room membership
      const room = `ticker:${ticker}`;

      // Emit with callback to verify delivery
      this.io.to(room).emit("price", JSON.parse(message))
    });
  }

  async restoreSubscriptions(socketId, clientId) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) {
      console.error(`Socket ${socketId} not found`);
      return;
    }
    const clientSubsStr = await this.redisClient.get(`clientsubs:${clientId}`);
    if (!clientSubsStr) return;

    const clientSubs = JSON.parse(clientSubsStr);
    if (clientSubs.length > 0) {
      // Join each ticker room
      for (const ticker of clientSubs) {
        console.log(`Client ${clientId} joining room: ticker:${ticker}`);
        const normalisedTicker = ticker.toUpperCase();
        const room = `ticker:${normalisedTicker}`;
        socket.join(room);
      }
      socket.emit("subscriptions_restored", clientSubs);
      console.log(
        `Restored ${clientSubs.length} subscriptions for client ${clientId}`
      );
    }
  }

  async subscribeClient(socketId, clientId, tickers) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) {
      console.error(`Socket ${socketId} not found`);
      return;
    }
    const clientSubsStr = await this.redisClient.get(`clientsubs:${clientId}`);
    const clientSubs = clientSubsStr ? JSON.parse(clientSubsStr) : [];

    for (const ticker of tickers) {
      const normalisedTicker = ticker.toUpperCase();
      const channel = `stock:price:${normalisedTicker}`;
      const room = `ticker:${normalisedTicker}`;
      socket.join(room);
      if (!clientSubs.includes(ticker)) {
        clientSubs.push(ticker);
        const count = await this.redisClient.incr(`channel:${channel}`);
        if (count === 1) {
          await this.redisSub.subscribe(channel);
          await StockPriceService.subscribe(ticker);
        }
      }
    }

    await this.redisClient.set(
      `clientsubs:${clientId}`,
      JSON.stringify(clientSubs)
    );
    socket.emit("subscribed", tickers);
  }

  async unsubscribeClient(socketId, clientId, tickers) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) {
      console.error(`Socket ${socketId} not found`);
      return;
    }
    const clientSubsStr = await this.redisClient.get(`clientsubs:${clientId}`);
    const clientSubs = clientSubsStr ? JSON.parse(clientSubsStr) : [];

    for (const ticker of tickers) {
      const normalisedTicker = ticker.toUpperCase();
      const channel = `stock:price:${normalisedTicker}`;
      const room = `ticker:${normalisedTicker}`;

      socket.leave(room);
      const index = clientSubs.indexOf(ticker);

      if (index !== -1) {
        clientSubs.splice(index, 1);
        const count = await this.redisClient.decr(`channel:${channel}`);
        if (count <= 0) {
          await this.redisSub.unsubscribe(channel);
          await this.redisClient.del(`channel:${channel}`);
          await StockPriceService.unsubscribe(ticker);
        }
      }
    }

    await this.redisClient.set(
      `clientsubs:${clientId}`,
      JSON.stringify(clientSubs)
    );
    socket.emit("unsubscribed", tickers);
  }

  async handleDisconnect(socketId) {
    // Get client ID associated with this socket
    const clientId = await this.redisClient.get(`socket:${socketId}`);

    if (clientId) {
      // We don't delete the subscriptions data on disconnect
      // Just clean up the socket mapping
      await this.redisClient.del(`client:socket:${clientId}`);
    }

    // Clean up socket data
    await this.redisClient.del(`socket:${socketId}`);
    console.log(`Client disconnected: ${socketId}`);
  }

  // Cleanup method - call this when shutting down the server gracefully
  async cleanup() {
    // Get all socket mappings and clean them up
    // Note: ioredis doesn't support pattern matching directly with keys command
    // You'd need to use scan for production usage with large datasets
    const keys = await this.redisClient.keys("socket:*");
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }

    console.log("Socket service cleaned up");
  }
}

module.exports = SocketService;
