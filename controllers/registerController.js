const User = require('../models/user');
const VerificationToken = require('../models/verificationtoken');
const crypto = require('crypto');
const send_email = require('../helpers/send_verify_email');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/connection');

module.exports = (req, res) => {
  const host = req.get('host');
  const { name, email, password, password2 } = req.body;
  let resetPasswordToken;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ where: { email: email }}).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2,
          csrfToken: req.csrfToken
        });
      } else {
        const secret = email + Date.now();
        verifyEmailToken =  crypto.createHmac('sha256', secret)
                           .update('I love cupcakes')
                           .digest('hex');
        send_email(email, host, verifyEmailToken);
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered. Please verify your email before logging in'
                );
                res.redirect('/users/login');
                const newToken = new VerificationToken({
                  userId: user.id,
                  token: verifyEmailToken,
                  expiresAt: Date.now() + 10 * 60 * 60 * 1000 // 10 hour
                });
                newToken
                  .save();
                // res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
}
