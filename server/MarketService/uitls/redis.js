const connectRedis = require('../config/redis');

const redisClient = connectRedis();

module.exports = redisClient;