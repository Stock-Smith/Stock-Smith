const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const config = require('../config/env');
const transporter = require('../config/nodemailerConfig');

const {BadRequestError, UnauthenticatedError} = require('../errors');

class AuthenticationService {
    async register(name, email, password) {
        const user = await User.create({ name, email, password });
        return { user: { name: user.name, email: user.email } };
    }

    async login(email, password) {
        if(!email || !password) {
            throw new BadRequestError('Please provide email and password!!');
        }

        const user = await User.findOne({ email });
        
          if (!user) {
            throw new UnauthenticatedError("Invalid email or password");
          }
        
          const isPasswordCorrect = await user.comparePassword(password);
          if (!isPasswordCorrect) {
            throw new UnauthenticatedError("Invalid email or password");
          }
        
          if (user.isMfaActive) {
            const tempToken = crypto.randomBytes(32).toString("hex");
            user.tempMfaToken = tempToken;
            user.tempMfaTokenExpiry = Date.now() + 5 * 60 * 1000;
            await user.save();
            return {
                message: "2FA required",
                isMfaActive: user.isMfaActive,
                tempToken,
            }
          }
        
          const jwtToken = this.#createTokenForUser(user);
          return {
            user: { name: user.name, email: user.email },
            token: jwtToken,
          };

    }

    
    
    #createTokenForUser (user) {
        if(!user) {
            throw new BadRequestError('No user provided');
        }
        const payload = {
            _id: user._id,
            name: user.name,
            email: user.email,
        };
        return jwt.sign(payload, config.jwtSecret, {expiresIn: '1h'});
    }
    
    verifyToken (token) {
        if(!token) {
            throw new BadRequestError('No token provided');
        }
        return jwt.verify(token, config.jwtSecret);
    }

    async setupMfa (email) {
    
      const user = await User.findOne({ email });
    
      if(!user) {
        throw new NotFoundError("User not found");
      }
    
      if (user.isMfaActive) {
        throw new BadRequestError("MFA is already active for this user");
      }
    
      const tempToken = crypto.randomBytes(32).toString("hex");
      user.tempMfaToken = tempToken;
      user.tempMfaTokenExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();
    
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
    
      await this.#sendMail(user.email, emailSubject, emailBody, attachments);
    
      await user.save();

      return {
        message: "MFA setup email sent",
        qrCode: qrImageURL,
        tempToken,
      };
    }

    async verifyMfa (email, token, tempMfaToken) {
      const user = await User.findOne({ email });
    
      if(!user) {
        throw new NotFoundError("User not found");
      }
    
    
      if (!token || !tempMfaToken) {
        throw new BadRequestError("MFA token is required");
      }
    
      if(tempMfaToken !== user.tempMfaToken) {
        throw new BadRequestError("Temporary token mismatch");
      }
    
      if(user.tempMfaTokenExpiry < Date.now()) {
        throw new BadRequestError("Token Expired");
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
    
      const jwtToken = this.#createTokenForUser(user);
      return {
        user: { name: user.name, email: user.email },
        token: jwtToken,
      };
    }
    
    async forgotPassword  (email) {
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
      await this.#sendMail(user.email, subject, message);
      return {
        message: "Password reset email sent",
      };
    }

    async resetPassword  (resetToken, password) {
        const resetPasswordToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");
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
        return {
            message: "Password reset successfully",
        }
      };

    
    async #sendMail (to, subject, message, attachments) {
        const mailOptions = {
            from: config.emailUser,
            to: to,
            subject: subject,
            html: message,
            attachments: attachments
        };
        await transporter.sendMail(mailOptions);
    }
}

module.exports = new AuthenticationService();