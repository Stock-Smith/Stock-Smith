require('express-async-errors');
const express = require("express");
const cors = require('cors');

// config
const config = require('./config/env');

// middleware
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

const fetchNewsRoute = require('./routes/news-fetch');

const app = express();

// Middlewares
app.use(express.json());
// app.use(cors());

app.use("/api/v1/news/", fetchNewsRoute);

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