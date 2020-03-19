const Cart = require('../models/Cart');
const User = require('../models/User');
const Order = require('../models/Order');


module.exports = (req, res) =>{
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
}
