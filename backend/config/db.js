const mongoose = require('mongoose');
const config = require("./env");

const connectDB = () => {
    return mongoose.connect(config.db.uri);
}

module.exports = connectDB;