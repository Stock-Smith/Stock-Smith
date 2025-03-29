require('express-async-errors');
const express = require('express');

const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

const connectDB = require('./config/db');
const config = require('./config/env');
const authRouter = require('./routes/authentication');

const app = express();
// Middlewares
app.use(express.json());

app.use('/api/v1/auth/', authRouter);

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
    catch (err){
        console.error(err);
    }
}

start();