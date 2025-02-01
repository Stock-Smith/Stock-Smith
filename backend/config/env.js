"use strict";
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    db: {
        uri: process.env.MONGO_DB_URI,
        dbName: process.env.MONGO_DB_NAME,
    },
    jwtSecret: process.env.JWT_SECRET,
}