const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
// const Product = require('../models/Product');
// const Cart = require('../models/Cart');
// const Order = require('../models/Order');
// const User = require('../models/User');

// routing
router.get("/", ensureAuthenticated, (req, res) => {
  console.log('I am heeeeeeer');
  res.sendfile(__dirname + "/index.html");

});

// routing
router.get("/track", async (req, res) => {
  const trackList = await getTracks();

  if (!trackList) {
    return res.send(404, "No track found");
  }

  res.writeHead(200, { "Content-Type": "routerlication/json" });
  res.write(JSON.stringify(trackList));
  res.end();
});

// routing
router.get("/track/:id", async (req, res) => {
  const id = req.params.id;
  const track = await getTrack(id);

  if (!track) {
    return res.send(404, 'Track not found with id "' + id + '"');
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(track));
  res.end();
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
// // Welcome Page
// router.get('/', forwardAuthenticated, (req, res) => {
//   let totalQty = 0;
//   let totalPrice = 0;
//   if(req.session.cart!==undefined){
//     const cart = new Cart(req.session.cart);
//     cart.generateArray().forEach(item=>{
//       totalPrice += item.item.price;
//       totalQty += item.qty;
//     });
//   }
//   res.render('welcome', {
//     user: null,
//     totalPrice,
//     totalQty
//   });
// });
//
// // Dashboard
// router.get('/dashboard', ensureAuthenticated, async (req, res) =>{
//   const products = await Product.findAll();
//   const userId = await req.user.id;
//   let purchased_item = [];
//   let totalQty = 0;
//   let totalPrice = 0;
//   const user = await User.findOne({
//     where:{
//       id:userId
//     },
//     include: [Order]
//   });
//   user.orders.forEach(order=>{
//     const items = order.description.split(',');
//     items.forEach(item=>{
//       purchased_item.push({name:item, purchased_at:order.createdAt});
//     });
//   });
//   if(req.session.cart!==undefined){
//     const cart = new Cart(req.session.cart);
//     cart.generateArray().forEach(item=>{
//       totalPrice += item.item.price;
//       totalQty += item.qty;
//     });
//   }
//   res.render('dashboard', {
//       user,
//       purchased_item,
//       totalQty,
//       totalPrice
//     });
//   }
// );


module.exports = router;
