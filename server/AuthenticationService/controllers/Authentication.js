const AuthenticationService = require("../services/Authentication");
const { StatusCodes } = require("http-status-codes");

class AuthenticationController {
  async register(req, res) {
    const user = await AuthenticationService.register(
      req.body.name,
      req.body.email,
      req.body.password
    );
    res
      .status(StatusCodes.CREATED)
      .json({ user: { name: user.user.name, email: user.user.email } });
  }

  async login(req, res) {
    const { email, password } = req.body;
    const user = await AuthenticationService.login(email, password);
    res.status(StatusCodes.OK).json(user);
  }

  async setupMfa(req, res) {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError("Please provide email");
    }
    const result = await AuthenticationService.setupMfa(email);
    res.status(StatusCodes.OK).json(result);
  }

  async verifyMfa(req, res) {
    const { email, token, tempMfaToken } = req.body;
    if (!email || !token || !tempMfaToken) {
      throw new BadRequestError("Please provide email and token");
    }
    const result = await AuthenticationService.verifyMfa(
      email,
      token,
      tempMfaToken
    );
    res.status(StatusCodes.OK).json(result);
  }

  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError("Please provide email");
    }
    const result = await AuthenticationService.forgotPassword(email);
    res.status(StatusCodes.OK).json(result);
  }

  async resetPassword(req, res) {
    const { resetToken } = req.params;
    const { password } = req.body;
    if (!resetToken || !password) {
      throw new BadRequestError("Please provide reset token and password");
    }
    const result = await AuthenticationService.resetPassword(
      resetToken,
      password
    );
    res.status(StatusCodes.OK).json(result);
  }

  async verify(req, res) {
    console.log("Verifying user");
    const { userId, name, email } = req.user;
    console.log(``);
    res.status(StatusCodes.OK).json(true);
  }
}

module.exports = new AuthenticationController();
