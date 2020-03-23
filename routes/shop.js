const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Order = require('../models/Order');
const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);
const { dontHaveItems } = require('../config/auth');

router.get('/test', (req, res, next)=>{

})

router.get('/', async (req, res, next)=>{
  const products = await Product.findAll();
  let totalQty = 0;
  let totalPrice = 0;
  const cart = new Cart(req.session.cart ? req.session.cart : {} );
  cart.generateArray().forEach(item=>{
    totalQty += item.qty;
    totalPrice += item.item.price * item.qty;
  });
  if(req.user){
    const userId = await req.user.id;
    const user = await User.findOne({
      where:{
        id:userId
      },
      include: [Order]
    });
    let orders = [];
    user.orders.forEach(order=>{
      function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
      }
      orders.push(order.productIds.split(","));
      orders = [].concat.apply([], orders);
      orders = orders.filter(onlyUnique);
    });
    return res.render('shop/shop', {
      products,
      orders,
      req,
      user,
      totalPrice,
      totalQty
    });
  }
  else {
    return res.render('shop/shop', {
      products,
      req,
      totalPrice,
      totalQty
    });
  }
});

function render_shop(req, res, products, orders, user, totalPrice, totalQty){
  
}

router.get('/add_to_shopping_cart/:id', (req, res)=>{
  // console.log(req.session.cart);
  let productId = req.params.id;
  let cart = new Cart(req.session.cart ? req.session.cart : {} );
  Product.findOne({where: {id: productId}}).then(async product=>{
    if(cart.items[productId] == undefined){
      await cart.add(product, product.id);
      req.session.cart = await cart;
      req.flash('success_msg', `${product.productName} is added to the cart`);
      return res.redirect('/shop');
    }
    else if(cart.items[productId] !== undefined){
      if(cart.items[productId].qty == 1){
        await req.flash('error_msg', 'You already have that item in cart');
        return res.redirect('/shop');
      }
      else if (cart.items[productId].qty == 0){
        await cart.add(product, product.id);
        req.session.cart = await cart;
        await req.flash('success_msg', `${product.productName} is added to the cart`);
        return res.redirect('/shop');
      }
    }
  })
  .catch(err => {
    console.log(err);
    return res.redirect('/shop');
  });
});

router.get('/cart_item_delete/:id', async (req, res)=>{
  const productId = await req.params.id;
  let cart = await new Cart(req.session.cart ? req.session.cart : {} );
  // console.log(cart.items[productId].qty);
  if (cart.items[productId].qty == 1){
    await cart.delete(productId);
    return res.redirect('back');
  } 
  else if (cart.items[productId].qty == 0){
    return res.redirect('back');
  }
});

router.get('/shopping_cart', (req, res)=>{
  const user = req.user;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  const products = cart.generateArray();
  let totalQty = 0;
  let totalPrice = 0;
  products.forEach(item=>{
    totalPrice += item.price;
    totalQty += item.qty;
  });
  if (Object.keys(cart.items).length == 0){
    return res.render('shop/shopping_cart', {
      products: null,
      user,
      totalQty,
      totalPrice
    });
  } else {
    return res.render('shop/shopping_cart', {
      products,
      user,
      totalQty,
      totalPrice
    });
  }
});

router.get('/checkout', ensureAuthenticated, async (req, res)=>{
  const userId = await req.user.id;
  const user = await User.findOne({
    where:{
      id:userId
    },
    include: [Order]
  });
  let purchased_before = [];
  user.orders.forEach(order=>{
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
    purchased_before.push(order.productIds.split(","));
    purchased_before = [].concat.apply([], purchased_before);
    purchased_before = purchased_before.filter(onlyUnique);
  });
  let totalPrice = 0;
  let totalQty = 0;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  cart.generateArray().forEach(item=>{
    totalQty += item.qty;
    totalPrice += item.price;
  });
  if(totalQty == 0){
    return res.redirect('/shop');
  } else {
    const products_in_cart = await cart.generateArray();
    return res.render('shop/checkout', {
      totalQty,
      totalPrice,
      purchased_before,
      user,
      products_in_cart,
      orders: user.orders
    });
  }
});

const postCheckoutController = require('../controllers/postCheckoutController');
router.post('/checkout', postCheckoutController);
  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys

module.exports = router;
