const nodemailer = require("nodemailer");

const sendEmail = async (mailOptions) => {
  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId," info : ",info);
  } catch (error) {
    console.error(error);
    throw new Error("Error sending email");
  }
};

module.exports = sendEmail;