"use strict";
const express = require('express');
const router = express.Router();
const { register, login, setupMfa, verifyMfa, resetMfa, forgotPassword, resetPassword } = require('../controllers/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/mfa/setup', setupMfa);
router.post('/mfa/verify', verifyMfa);
router.post('/mfa/reset', resetMfa);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

module.exports = router;