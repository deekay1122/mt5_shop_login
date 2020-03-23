const stripe = require('stripe')(process.env.SECRET_KEY);
const Cart = require('../models/Cart');
const Order = require('../models/Order');

module.exports = (req, res) =>{
  const cart = new Cart(req.session.cart);
  const products = cart.generateArray();
  let totalPrice = 0;
  products.forEach(product => {
    totalPrice += (product.price * product.qty)
  });
  const token = req.body.stripeToken;
  const email = req.body.email;
  let id_list = [];
  let purchased_item = [];
  cart.generateArray().forEach(product=>{
    id_list.push(product.item.id);
    purchased_item.push(product.item.productName);
  });
  console.log(id_list);
  console.log(purchased_item);
  stripe.customers.create({
    email: email,
    source: token
  }, function(err, customer){
    if(err){
      console.log(err);
    }
    stripe.charges.create({
      amount: totalPrice,
      currency: 'jpy',
      customer: customer.id,
      description: 'test charge'
    }, function(err, charge){
      if(err){
        console.log(err);
      }
      const newOrder = new Order({
        userId: req.user.id,
        productIds: id_list.toString(),
        description: purchased_item.toString(),
        totalAmount: totalPrice,
      });
      newOrder.save();
      delete req.session.cart;
      return res.redirect('/dashboard');
    });
  });
}
