const express = require('express');
const router = express.Router();
const passport = require('passport');
// Load User model
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const { forwardAuthenticated } = require('../config/auth');
const sequelize = require('../config/connection');
const csrfProtection = require('../config/csrf');
const parseForm = require('../config/parseForm');
const Cart = require('../models/Cart');

// Register Page
router.get('/register', csrfProtection, forwardAuthenticated, (req, res) =>{
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  let totalPrice = 0;
  let totalQty = 0;
  cart.generateArray().forEach(item=>{
    totalPrice += item.item.price;
    totalQty += item.qty;
  });
  res.render('register', {
    csrfToken: req.csrfToken,
    totalPrice,
    totalQty
   })
});

// Register
const RegisterController = require('../controllers/registerController');
router.post('/register', parseForm, csrfProtection, RegisterController);

// Verification
const VerificationController = require('../controllers/verificationController');
router.get('/verification', VerificationController);

// get Login Page
router.get('/login', csrfProtection, forwardAuthenticated, (req, res) => {
  let totalQty = 0;
  let totalPrice = 0;
  const cart = new Cart(req.session.cart ? req.session.cart : {} );
  cart.generateArray().forEach(item=>{
    totalPrice += item.item.price;
    totalQty += item.qty;
  });
  res.render('login', {
   csrfToken: req.csrfToken,
   originalUrl: undefined,
   totalPrice,
   totalQty
 })
});

// Login handler
router.post('/login', parseForm, csrfProtection, (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: req.session.originalUrl ? req.session.originalUrl : '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', async (req, res) => {
  req.logout();
  await req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

// get forgot password
router.get('/forgot', csrfProtection, forwardAuthenticated, (req, res) => {
  let totalQty = 0;
  let totalPrice = 0;
  const cart = new Cart(req.session.cart ? req.session.cart : {} );
  cart.generateArray().forEach(item=>{
    totalPrice += item.item.price;
    totalQty += item.qty;
  });
  res.render('forgot', {
    csrfToken: req.csrfToken,
    totalQty,
    totalPrice
  });
});

// forgot password handler
const SendResetPasswordController = require('../controllers/sendResetPasswordController');
router.post('/forgot', parseForm, csrfProtection, SendResetPasswordController);

//  get reset password & handler
const VerifyResetLinkController = require('../controllers/verifyResetLinkController');
router.get('/reset_password', forwardAuthenticated, csrfProtection, VerifyResetLinkController);

// password reset handler
const PostNewPasswordController = require('../controllers/postNewPasswordController');
router.post('/reset_password', parseForm, csrfProtection, PostNewPasswordController);

// get resend_verification
router.get('/resend_verification', forwardAuthenticated, csrfProtection, (req, res) => {
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  let totalQty = 0;
  let totalPrice = 0;
  cart.generateArray().forEach(item=>{
    totalPrice += item.item.price;
    totalQty += item.qty;
  });
  res.render('resendVerification', {
    csrfToken: req.csrfToken,
    totalPrice,
    totalQty
  });
});

// resend_verification handler
const ResendVerificationController = require('../controllers/resendVerificationController');
router.post('/resend_verification', parseForm, csrfProtection, ResendVerificationController);

module.exports = router;
