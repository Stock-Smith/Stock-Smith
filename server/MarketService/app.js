require('express-async-errors');
const express = require('express');
const cors = require('cors');
const http = require('http');

const config = require('./config/env');

// middleware
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

const marketRoutes = require('./routes/market-routes');
const stockRoutes = require('./routes/stock-route');

const StockPriceService = require('./service/StockPriceService');
const SocketService = require('./service/SocketService');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors());

app.use('/api/v1/market/', marketRoutes);
app.use('/api/v1/stock/', stockRoutes);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

// Initialize Socket.IO service with the HTTP server
const socketService = new SocketService(server);

const start = async () => {
    try {
        await StockPriceService.resetConnections();
        // Connect to Tiingo WebSocket API
        await StockPriceService.connect()
            .then(() => {
                console.log('Connected to Tiingo WebSocket API');
                // Initial subscriptions (optional)
                // StockPriceService.subscribe('aapl');
                // StockPriceService.subscribe('msft');
                // StockPriceService.subscribe('amzn');
            })
            .catch((err) => {
                console.error('Failed to connect to Tiingo WebSocket API:', err);
            });

        // Start the HTTP server
        server.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
    catch (err){
        console.error(err);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server gracefully...');
    await socketService.cleanup();
    process.exit(0);
});

start();