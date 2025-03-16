require('express-async-errors');
const express = require('express');
const cors = require('cors');

const config = require('./config/env');

// middleware
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

const marketRoutes = require('./routes/market-routes');
const stockRoutes = require('./routes/stock-route');

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/v1/market/', marketRoutes);
app.use('/api/v1/stock/', stockRoutes);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const start = async () => {
    try {
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
    catch (err){
        console.error(err);
    }
}


start();