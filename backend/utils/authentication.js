"use strict";
const config = require('../config/env');
const jwt = require('jsonwebtoken');

const createTokenForUser = (user) => {
    const payload = {
        _id: user._id,
        name: user.name,
        email: user.email,
    };
    return jwt.sign(payload, config.jwtSecret, {expiresIn: '1h'});
}

const verifyToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
}

module.exports = {
    createTokenForUser,
    verifyToken
};