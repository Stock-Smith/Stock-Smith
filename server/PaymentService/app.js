"use strict";
require('express-async-errors');
const express = require("express");
const cors = require('cors');

const config = require("./config/env");

const errorHandlerMiddleware = require("./middleware/error-handler");
const notFoundMiddleware = require("./middleware/not-found");

const subscriptionRouter = require("./routes/subscription");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

app.use("/api/v1/subscription", subscriptionRouter);

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