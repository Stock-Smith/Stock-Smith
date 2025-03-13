const transporter = require('../config/nodemailerConfig');
const config = require('../config/env');

const sendMail = async (to, subject, message, attachments) => {
    const mailOptions = {
        from: config.emailUser,
        to: to,
        subject: subject,
        html: message,
        attachments: attachments
    };
    await transporter.sendMail(mailOptions);
}

module.exports = sendMail;