const User = require('../models/user');
const VerificationToken = require('../models/verificationtoken');
const crypto = require('crypto');
const send_email = require('../helpers/send_verify_email');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/connection');

module.exports = (req, res) => {
  const host = req.get('host');
  const { email } = req.body;
  let verifyEmailToken;
  let errors = [];

  if (!email) {
    errors.push({ msg: 'Please enter email' });
  }

  if (errors.length > 0) {
    res.render('resendVerification', {
      errors,
      email,
      csrfToken: req.csrfToken
    });
  } else {
    User.findOne({ where: { email: email }}).then(user => {
      if (!user) {
        errors.push({ msg: 'Email does not exist' });
        res.render('resendVerification', {
          errors,
          email,
          password,
          csrfToken: req.csrfToken
        });
      } else {
        const secret = email + Date.now();
        verifyEmailToken =  crypto.createHmac('sha256', secret)
                           .update('I love cupcakes')
                           .digest('hex');
        send_email(email, host, verifyEmailToken);
        req.flash('success_msg', 'Verification email sent. Please verify your email before logging in');
        const newToken = new VerificationToken({
          userId: user.id,
          token: verifyEmailToken,
          expiresAt: Date.now() + 10 * 60 * 60 * 1000 // 10 hour
        });
        newToken.save();
        res.redirect('/users/login');
      }
    })
    .catch(err => {
      console.err(err);
    });
}
}
