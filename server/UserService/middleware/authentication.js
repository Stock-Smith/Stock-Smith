const {UnauthenticatedError} = require('../errors');
const { verifyToken } = require('../utils/authentication');

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