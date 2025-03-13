const nodemailer = require('nodemailer');
const config = require('./env');

const transporter = nodemailer.createTransport({
    pool: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

module.exports = transporter;