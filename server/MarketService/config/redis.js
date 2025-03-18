const Redis = require('ioredis');
const config = require('./env');

const connectRedis = () => {
    const client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
    });
    client.on('connect', () => {
        console.log('Connected to Redis');
    });
    client.on('error', (error) => {
        console.error('Redis error:', error);
    });
    return client;
}


module.exports = connectRedis;