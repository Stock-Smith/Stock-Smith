const { UnauthenticatedError } = require('../errors');

const checkAuth = (req, res, next) => {
    if(!req.isAuthenticated()) {
        throw new UnauthenticatedError("User not authenticated");
    }
    return next();
};

module.exports = checkAuth;