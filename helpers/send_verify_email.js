const nodemailer = require('nodemailer');

module.exports = async function (email, host ,hash) {
  const transporter = await nodemailer.createTransport({
    service: "Gmail",
    auth: {
            type: 'OAuth2',
            user: process.env.GMAILUSER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECERT,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });
  let info = await transporter.sendMail({
      from: process.env.GMAILUSER, // sender address
      to: email, // list of receivers
      subject: 'Please verify your email', //subject line
      html: `<p>To verify this email, please click the link<br>http://${host}/users/verification?token=${hash}&email=${email}</p>` // html body
  });
  console.log('Message sent: %s', info.messageId);
}
