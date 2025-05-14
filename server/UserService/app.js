require('express-async-errors');
const express = require('express');
const cors = require('cors');
const PaymentVerificationController = require('./controllers/payment-verification');

// database
const connectDB = require('./config/db');
// config
const config = require('./config/env');

// middleware
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFoundMiddleware = require('./middleware/not-found');

// routers
const authRouter = require('./routes/auth');
const watchlistRouter = require('./routes/watchlist');
const holdingRouter = require('./routes/holding');

const app = express();

// Middlewares
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173', // Replace with your frontend origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
//  app.use(cors(corsOptions));
//app.use(cors());

// app.use(session({
//     secret: config.sessionSecret,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         maxAge: 1000 * 60 * 60,
//     }
// }));


app.use('/api/v1/auth/', authRouter);
app.use('/api/v1/user/', watchlistRouter);
app.use('/api/v1/user/holdings', holdingRouter);

app.use(errorHandlerMiddleware);
app.use(notFoundMiddleware);

const start = async () => {
    try {
        await connectDB();
        await PaymentVerificationController.init();
        
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