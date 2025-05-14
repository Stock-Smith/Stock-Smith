const {UnauthenticatedError} = require('../errors');
const { verifyToken } = require('../utils/authentication');

const auth = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        throw new UnauthenticatedError("User not authenticated");
    }
    req.userId = userId;
    next();
}

module.exports = auth;