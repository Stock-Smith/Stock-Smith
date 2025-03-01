"use strict";
const express = require('express');
const router = express.Router();
const passport = require('passport');
const checkAuth = require('../middleware/check-auth');
const { register, login, authStatus, logout, setupMfa, verifyMfa, resetMfa, forgotPassword, resetPassword } = require('../controllers/auth');

router.post('/register', register);
router.post('/login', passport.authenticate("local"), login);
router.get('/status', authStatus);
router.post('/logout', logout);
router.post('/mfa/setup', checkAuth, setupMfa);
router.post('/mfa/verify', checkAuth, verifyMfa);
router.post('/mfa/reset', checkAuth, resetMfa);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

module.exports = router;