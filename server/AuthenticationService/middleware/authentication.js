const {UnauthenticatedError} = require('../errors');
const AuthenticationService = require('../services/Authentication');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthenticatedError('Authentication invalid');
    }
    const token = authHeader.split(' ')[1];

    try {
        const payload = AuthenticationService.verifyToken(token);
        if(!payload) {
            throw new UnauthenticatedError('Authentication invalid');
        }
        req.user = { userId: payload._id, name: payload.name, email: payload.email };
        res.setHeader('X-User-Id', payload._id);
        res.setHeader('X-User-Name', payload.name);
        res.setHeader('X-User-Email', payload.email);
        console.log("ID", payload._id);
        console.log("Name", payload.name);
        console.log("Email", payload.email);
        console.log("User authenticated successfully");
        console.log("Headers set:", res.getHeaders());
        next();
    } catch (error) {
        throw new UnauthenticatedError('Authentication invalid');
    }
}

module.exports = auth;