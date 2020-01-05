const User = require('../models/user');
const ResetPasswordToken = require('../models/resetpasswordtoken');
const Cart = require('../models/Cart');


module.exports = (req, res) => {
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  let totalQty = 0;
  let totalPrice = 0;
  cart.generateArray().forEach(item=>{
    totalQty += item.qty;
    totalPrice += item.item.price;
  });
  let errors = [];
  const email = req.query.email;
  if(email == undefined){
    res.redirect('/users/login');
  }
  return User.findOne({
    where: { email: req.query.email }
  })
    .then(user => {
      return ResetPasswordToken.findOne({ where: { userId: user.id }})
      .then(foundToken=>{
        if(foundToken.token = req.query.token){
          errors.push({ msg: `Hello ${user.name}! Please enter new password` });
          res.render('reset', {
            errors,
            user,
            csrfToken: req.csrfToken,
            totalQty,
            totalPrice
          })
        }
      })
      .catch(err => {
        console.log(err);
        res.redirect('/users/register');
      });
    })
}
