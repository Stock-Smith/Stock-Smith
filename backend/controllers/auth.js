"use strict";
const User = require("../models/UserModel");
const { StatusCodes } = require("http-status-codes");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const crypto = require("crypto");
const config = require("../config/env");

const { createTokenForUser } = require("../utils/authentication");
const sendMail = require("../utils/sendMail");
const { BadRequestError, UnauthenticatedError } = require("../errors");

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user information
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user information
 */
const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  res
    .status(StatusCodes.CREATED)
    .json({ user: { name: user.name, email: user.email } });
};

// const login = async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     throw new BadRequestError("Please provide email and password!!");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new UnauthenticatedError("Invalid email or password");
//   }

//   const isPasswordCorrect = await user.comparePassword(password);
//   if (!isPasswordCorrect) {
//     throw new UnauthenticatedError("Invalid email or password");
//   }

//   const token = createTokenForUser(user);
//   res
//     .status(StatusCodes.OK)
//     .json({ user: { name: user.name, email: user.email }, token });
// };

/**
 * User login handler for passport authentication
 * @param {Object} req - Express request object with authenticated user
 * @param {Object} req.user - User object from passport authentication
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user information
 */
const login = async (req, res) => {
  const user = req.user;
  res.status(StatusCodes.OK).json({
    user: {
      name: user.name,
      email: user.email,
      isMfaActive: user.isMfaActive,
    },
  });
};

/**
 * Check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object if authenticated
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user information if authenticated
 * @throws {UnauthenticatedError} If user is not authenticated
 */
const authStatus = async (req, res) => {
  if (req.user) {
    const user = req.user;
    res.status(StatusCodes.OK).json({
      user: {
        name: user.name,
        email: user.email,
        isMfaActive: user.isMfaActive,
      },
    });
  } else {
    throw new UnauthenticatedError("User not authenticated");
  }
};

/**
 * Logout current user
 * @param {Object} req - Express request object
 * @param {Object} req.user - User object if authenticated
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming logout
 * @throws {UnauthenticatedError} If user is not authenticated
 */
const logout = async (req, res) => {
  if (!req.user) {
    throw new UnauthenticatedError("User not authenticated");
  }
  req.logout((err) => {
    if (err) {
      throw new UnauthenticatedError("User not authenticated");
    } else {
      res
        .status(StatusCodes.OK)
        .json({ message: "User logged out successfully" });
    }
  });
};

/**
 * Setup Multi-Factor Authentication for a user
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with QR code for MFA setup
 * @throws {BadRequestError} If MFA is already active
 */
const setupMfa = async (req, res) => {
  const user = req.user;

  if (user.isMfaActive) {
    throw new BadRequestError("MFA is already active for this user");
  }

  const secret = speakeasy.generateSecret();
  user.mfaSecret = secret.base32;
  user.isMfaActive = true;

  const url = speakeasy.otpauthURL({
    secret: secret.base32,
    label: encodeURIComponent(user.name),
    issuer: encodeURIComponent("Stock-Smith"),
    encoding: "base32",
  });

  const qrImageURL = await qrcode.toDataURL(url);

  const emailSubject = "MFA Setup for Stock-Smith";
  const emailBody = `
      <p>Hello ${user.name},</p>
      <p>You have successfully set up Multi-Factor Authentication (MFA) for your account. Please scan the QR code below using your authenticator app to complete the setup:</p>
      <img src="cid:qrCode" alt="MFA QR Code" style="width: 200px; height: 200px;"/>
      <p>Thank you,<br/>The Stock-Smith Team</p>
    `;

  const attachments = [
    {
      filename: "qrcode.png",
      content: qrImageURL.split(";base64,").pop(),
      encoding: "base64",
      cid: "qrCode",
    },
  ];

  await sendMail(
    user.email,
    emailSubject,
    emailBody,
    attachments
  );

  await user.save();

  res.status(StatusCodes.OK).json({ qrCode: qrImageURL });
};

/**
 * Verify MFA token provided by user
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing token
 * @param {String} req.body.token - MFA token to verify
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with JWT token if verified
 * @throws {BadRequestError} If token is missing or incorrect
 */
const verifyMfa = async (req, res) => {
  const { token } = req.body;
  const user = req.user;

  if (!token) {
    throw new BadRequestError("MFA token is required");
  }

  if (!user || !user.mfaSecret) {
    throw new BadRequestError("User information is missing or invalid");
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfaSecret,
    encoding: "base32",
    token,
  });

  if (!verified) {
    throw new BadRequestError("Incorrect MFA token");
  }

  const jwtToken = createTokenForUser(user);
  res
    .status(StatusCodes.OK)
    .json({ user: { name: user.name, email: user.email }, token: jwtToken });
};

/**
 * Reset MFA for a user
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming MFA reset
 */
const resetMfa = async (req, res) => {
  const user = req.user;

  user.mfaSecret = null;
  user.isMfaActive = false;

  await user.save();

  res.status(StatusCodes.OK).json({ message: "MFA reset successfully" });
};

/**
 * Handle forgot password request
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {String} req.body.email - User email
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming email sent
 * @throws {BadRequestError} If user not found
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new BadRequestError("User not found");
  }
  const resetToken = user.getResetPasswordToken();
  await user.save();
  const resetUri = `${config.clientURI}/resetpassword/${resetToken}`;
  const message = `
    <h1>You have requested a password reset</h1>
    <p>Please go to this link to reset your password</p>
    <a href=${resetUri} clicktracking=off>${resetUri}</a>
  `;
  const subject = "Password reset request - Stock-Smith";
  await sendMail(user.email, subject, message);
  res.status(StatusCodes.OK).json({ message: "Email sent" });
}

/**
 * Reset user password with valid token
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {String} req.params.resetToken - Password reset token
 * @param {Object} req.body - Request body
 * @param {String} req.body.password - New password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming password reset
 * @throws {BadRequestError} If token is invalid or expired
 */
const resetPassword = async(req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    throw new BadRequestError("Invalid reset token");
  }
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();
  res.status(StatusCodes.OK).json({ message: "Password reset successfully" });
}

module.exports = {
  register,
  login,
  logout,
  authStatus,
  setupMfa,
  verifyMfa,
  resetMfa,
  forgotPassword,
  resetPassword
};
