const User = require('../models/user');
const VerificationToken = require('../models/verificationtoken');

const VerificationController = (req, res) => {
  return User.findOne({
    where: { email: req.query.email }
  })
    .then(user => {
      if (user.isVerified) {
        req.flash('success_msg', 'This email is already verified and can log in');
        res.redirect('/users/login');
      } else {
        return VerificationToken.findOne({
          where: { token: req.query.token }
        })
          .then((foundToken) => {
            if(Date.parse(foundToken.expiresAt) > Date.parse(Date())) {
              return user
                .update({ isVerified: true })
                .then(updatedUser => {
                  req.flash(
                    'success_msg',
                    'Your email is now verified and can log in'
                  );
                  res.redirect('/users/login');
                })
                .catch(reason => {
                  req.flash('error_msg', 'Verification Failed');
                  res.redirect('/users/resend_verification');
                });
            } else {
              req.flash('error_msg', 'Token Expired');
              res.redirect('/users/resend_verification');
            }
          })
          .catch(reason => {
            req.flash('error_msg', 'Token Expired');
            res.redirect('/users/resend_verification');
          });
      }
    })
    .catch(reason => {
      req.flash('error_msg', 'Verification Failed');
      res.redirect('/users/resend_verification');
    });
}

module.exports = VerificationController;
