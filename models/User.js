const Sequelize = require('sequelize');
const sequelize = require('../config/connection');
const Order = require('./Order');

const User = sequelize.define('user', {
  // attributes
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  isVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
}, {
  classMethods: {
  associate: function(models) {
   User.hasOne(models.VerificationToken, {
        as: 'verificationtoken',
        foreignKey: 'userId',
        foreignKeyConstraint: true,
      });
    User.hasOne(models.ResetPasswordToken, {
        as: 'resetpasswordtoken',
        foreignKey: 'userId',
        foreignKeyConstraint: true,
    });
  }
}
});
// User.associate = function(){
//   User.hasMany(Order);
// };

module.exports = User;
