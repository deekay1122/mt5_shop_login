const Sequelize = require('sequelize');
const sequelize = require('../config/connection');

const Order = sequelize.define('order', {
  // attributes
  productIds: {
    type: Sequelize.STRING,
    allowNull: false
  },
  totalAmount: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false
  }
}, {});


module.exports = Order;
