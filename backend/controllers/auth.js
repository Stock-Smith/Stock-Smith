"use strict";
const User = require("../models/UserModel");
const { StatusCodes } = require("http-status-codes");
const { createTokenForUser } = require("../utils/authentication");
const {
  BadRequestError,
  UnauthenticatedError,
} = require("../errors");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = createTokenForUser(user);
  res
    .status(StatusCodes.CREATED)
    .json({ user: { name: user.name, email: user.email }, token });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password!!");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const token = createTokenForUser(user);
  res
    .status(StatusCodes.OK)
    .json({ user: { name: user.name, email: user.email }, token });
};

module.exports = {
  register,
  login,
};
