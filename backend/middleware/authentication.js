const {UnauthenticatedError} = require('../errors');
const { verifyToken } = require('../utils/authentication');

/**
 * Authentication middleware for JWT token verification
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {String} req.headers.authorization - Authorization header containing Bearer token
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {UnauthenticatedError} If token is missing, invalid, or expired
 */
const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError('Authentication invalid');
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = verifyToken(token);
        req.user = { userId: payload._id, name: payload.name, email: payload.email };
        next();
    } catch (error) {
        throw new UnauthenticatedError('Authentication invalid');
    }
}

module.exports = auth;