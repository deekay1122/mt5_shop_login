const User = require('../models/user');
const ResetPasswordToken = require('../models/resetpasswordtoken');
const send_email = require('../helpers/send_passwordreset_email');
const crypto = require('crypto');
const Cart = require('../models/Cart');

module.exports = (req, res) => {
  // construct cart variable
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  let totalQty = 0;
  let totalPrice = 0;
  cart.generateArray().forEach(item=>{
    totalQty += item.qty;
    totalPrice += item.item.price;
  });
  const host = req.get('host');
  let errors = [];
  const email = req.body.email;
  const secret = email + Date.now();
  const hash =  crypto.createHmac('sha256', secret)
                     .update('I love cupcakes')
                     .digest('hex');
  return User.findOne({ where: { email: email }})
    .then(user => {
      if (!user) {
        errors.push({ msg: 'That email is not registered' });
        res.render('forgot', {
          errors,
          email,
          csrfToken: req.csrfToken,
          totalPrice,
          totalQty
        });
      }
      if(user){
          return ResetPasswordToken.findOne({ where: { userId: user.id }})
          .then(foundToken=>{
            if(!foundToken){
              const foundToken = new ResetPasswordToken({
                userId: user.id,
                token: hash,
                expiresAt: Date.now() + 10 * 60 * 60 * 1000 // 10 hour
              });
              foundToken.save();
              send_email(user.email, host, hash);
              errors.push({ msg: 'Password reset link is sent to your account' });
              res.render('forgot', {
                errors,
                email,
                csrfToken: req.csrfToken,
                totalPrice,
                totalQty
              });
            }
            if(foundToken){
              foundToken.update({
                token: hash,
                expiresAt: Date.now() + 10 * 60 * 60 * 1000 // 10 hour
              });
              send_email(user.email, host, hash);
              errors.push({ msg: 'Password reset link is sent to your account'});
              res.render('forgot', {
                errors,
                email,
                csrfToken: req.csrfToken,
                totalQty,
                totalPrice
              });
            }
          })
          .catch(err => console.log(err));
      }
    })
    .catch(err => console.log(err));
}
