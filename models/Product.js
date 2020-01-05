const Sequelize = require('sequelize');
const sequelize = require('../config/connection');
const Model = Sequelize.Model;

class Product extends Model {}
Product.init({
  // attributes
  productName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  imagePath: {
    type: Sequelize.TEXT
    // allowNull defaults to true
  },
  description: {
    type: Sequelize.TEXT
  },
  price: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'product'
});

module.exports = Product;
