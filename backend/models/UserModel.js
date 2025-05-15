const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * User Schema - Defines the structure of user data in MongoDB
 * @typedef {Object} UserSchema
 * @property {String} name - User's full name
 * @property {String} email - User's email address (unique)
 * @property {String} password - User's hashed password
 * @property {Boolean} isMfaActive - Whether multi-factor authentication is active
 * @property {String} mfaSecret - Secret key for MFA
 * @property {String} resetPasswordToken - Token for password reset
 * @property {Date} resetPasswordExpire - Expiration time for password reset token
 * @property {Date} createdAt - When the user was created
 * @property {Date} updatedAt - When the user was last updated
 */
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    isMfaActive: {
        type: Boolean,
        default: false,
    },
    mfaSecret: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
}, { timestamps: true});


/**
 * Pre-save middleware to hash the user's password before saving to database
 * Only hashes the password if it has been modified
 * @function
 * @param {Function} next - Express middleware next function
 */
UserSchema.pre('save', async function(next) {
    const user = this;
    if(!user.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
});

/**
 * Compare a candidate password with the user's hashed password
 * @method comparePassword
 * @param {String} candidatePassword - The password to check
 * @returns {Boolean} True if passwords match, false otherwise
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

/**
 * Generate a token for password reset functionality
 * @method getResetPasswordToken
 * @returns {String} Reset token in plain text form
 */
UserSchema.methods.getResetPasswordToken = function () {
    const resetToekn = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToekn).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * (60 * 1000);
    return resetToekn;
}

module.exports = mongoose.model('User', UserSchema);