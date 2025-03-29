const express = require('express');
const router = express.Router();

const AuthenticationController = require('../controllers/Authentication');

router.post('/register', AuthenticationController.register);
router.post('/login', AuthenticationController.login);
router.post('/mfa/setup', AuthenticationController.setupMfa);
router.post('/mfa/verify', AuthenticationController.verifyMfa);
// router.post('/mfa/reset', resetMfa);
router.post('/forgotpassword', AuthenticationController.forgotPassword);
router.put('/resetpassword/:resetToken', AuthenticationController.resetPassword);

module.exports = router;