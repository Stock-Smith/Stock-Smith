"use strict";
require('express-async-errors');
const express = require('express');

// database
const connectDB = require('./config/db');
// config
const config = require('./config/env');

// middleware
const authenticateUser = require('./middleware/authentication');
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

// routers
const authRouter = require('./routes/auth');

const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const start = async () => {
    try {
        await connectDB();
        console.log('Connected to database');
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    }
    catch {
        console.error(err);
    }
}

start();