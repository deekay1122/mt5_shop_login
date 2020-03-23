require('dotenv').config();
// Developed by Michel Buffa

const fs = require("fs");
// We need to use the express framework: have a real web server that knows how to send mime types etc.
const express = require("express");
const path = require("path");
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

// Init globals variables for each module required
const app = express(),
  http = require("http"),
  server = http.createServer(app);

// Ensure Authenticated
const { ensureAuthenticated, forwardAuthenticated } = require('./config/auth');

// Stripe Config
const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const stripe = require("stripe")(keySecret);

// Passport Config
require('./config/passport')(passport);

// DB Config
const Sequelize = require('sequelize');
const sequelize = require('./config/connection');
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Cart = require('./models/Cart');

User.hasMany(Order);

// Connect to Mysql
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  sequelize.sync();

// EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
// app.use(express.static(path.join(__dirname, '/public')));

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({
      db: sequelize
    }),
    cookie: { maxAge: 60 * 60 * 1000 }
  })
);

// JSON Config
app.use(
  express.json({
    // We need the raw body to verify webhook signatures.
    // Let's compute it only when hitting the Stripe webhook endpoint.
    verify: function(req, res, buf) {
      if (req.originalUrl.startsWith("/webhook")) {
        req.rawBody = buf.toString();
      }
    }
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.isLoggedIn = req.isAuthenticated();
  res.locals.session = req.session;
  next();
});

// Config
const PORT = process.env.PORT,
  TRACKS_PATH = "./client/multitrack",
  addrIP = process.env.IP;

// if (PORT == 8009) {
//   app.use(function(req, res, next) {
//     const user = auth(req);
//
//     if (user === undefined || user["name"] !== "super" || user["pass"] !== "secret") {
//       res.statusCode = 401;
//       res.setHeader("WWW-Authenticate", 'Basic realm="Super duper secret area"');
//       res.end("Unauthorized");
//     } else {
//       next();
//     }
//   });
// }

// app.use(express.static(path.resolve(__dirname, "client")));
// app.use(express.static(path.join(__dirname, "/client")));
// app.use('client', express.static('client'));
app.use(express.static('client'));

// Routes
app.use('/users', require('./routes/users'));
app.use('/shop', require('./routes/shop'));

// launch the http server on given port
server.listen(PORT || 3000, addrIP || "0.0.0.0", () => {
  // const addr = server.address();
  console.log("MT5 server listening at", addrIP + ":" + PORT);
});

// routing
app.get("/multitracker", ensureAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/index.html");

});

// routing
app.get("/track", async (req, res) => {
  const trackList = await getTracks();
  const userId = await req.user.id;
  let purchased_items = [];
  let modified_trackList = [];
  const user = await User.findOne({
    where:{
      id:userId
    },
    include: [Order]
  });
  user.orders.forEach(order=>{
    const items = order.description.split(',');
    items.forEach(item=>{
      purchased_items.push(item);
    });
  });
  for (let i = 0; i < trackList.length; i++)
  {
    for (let j = 0; j < purchased_items.length; j++)
    {
      if (trackList[i] == purchased_items[j])
      {
        modified_trackList.push(trackList[i])
      }
    }
  }
  if (!modified_trackList) {
    return res.send(404, "No track found");
  }
  
  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(modified_trackList));
  res.end();
});

// routing
app.get("/track/:id", async (req, res) => {
  const id = req.params.id;
  const track = await getTrack(id);

  if (!track) {
    return res.send(404, 'Track not found with id "' + id + '"');
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(track));
  res.end();
});

// Dashboard
app.get('/dashboard', ensureAuthenticated, async (req, res) =>{
  const products = await Product.findAll();
  const userId = await req.user.id;
  let purchased_item = [];
  let totalQty = await 0;
  let totalPrice = await 0;
  const user = await User.findOne({
    where:{
      id:userId
    },
    include: [Order]
  });
  user.orders.forEach(order=>{
    const items = order.description.split(',');
    items.forEach(item=>{
      purchased_item.push({name:item, purchased_at:order.createdAt});
    });
  });
  if(req.session.cart!==undefined){
    const cart = new Cart(req.session.cart);
    await cart.generateArray().forEach(item=>{
      totalPrice += item.item.price;
      totalQty += item.qty;
    });
  }
  return res.render('dashboard', {
      user,
      purchased_item,
      totalQty,
      totalPrice
    });
  }
);

app.get('/download', ensureAuthenticated, function(req, res){
  const file = `${__dirname}/client/multitrack/AdmiralCrumple_KeepsFlowing/01_Kick1.mp3`;
  res.download(file); // Set disposition and send it.
});

const getTracks = async () => {
  const directories = await getFiles(TRACKS_PATH);
  return directories.filter(dir => !dir.match(/^.DS_Store$/));
};

const endsWith = (str, suffix) => str.indexOf(suffix, str.length - suffix.length) !== -1;

isASoundFile = fileName => {
  if (endsWith(fileName, ".mp3")) return true;
  if (endsWith(fileName, ".ogg")) return true;
  if (endsWith(fileName, ".wav")) return true;
  if (endsWith(fileName, ".m4a")) return true;
  return false;
};

const getTrack = async id =>
  new Promise(async (resolve, reject) => {
    if (!id) reject("Need to provide an ID");

    const fileNames = await getFiles(`${TRACKS_PATH}/${id}`);
    if (!fileNames) {
      reject(null);
    }

    fileNames.sort();

    const track = {
      id: id,
      instruments: fileNames
        .filter(fileName => isASoundFile(fileName))
        .map(fileName => ({
          name: fileName.match(/(.*)\.[^.]+$/, "")[1],
          sound: fileName
        }))
    };

    resolve(track);
  });

const getFiles = async dirName =>
  new Promise((resolve, reject) =>
    fs.readdir(dirName, function(error, directoryObject) {
      if (error) {
        reject(error);
      }
      if (directoryObject !== undefined) {
        directoryObject.sort();
      }
      resolve(directoryObject);
    })
  );

  // product seeder
// require('./seeders/productSeeder');
