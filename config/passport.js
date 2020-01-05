const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({　where: {　email: email　}　})
        .then(user => {
          if(!user) {
            return done(null, false, { message: 'That email is not registered' });
          }
          if(!user.isVerified){
            return done(null, false, { message: 'Please verify email'} );
          }

          // Match password
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: 'Password incorrect' });
            }
          });
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  })
  passport.deserializeUser((id, done) => {
  User.findOne({ where: { id: id } })
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    })
  })
}
