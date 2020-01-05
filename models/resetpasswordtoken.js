const Sequelize = require('sequelize');
const sequelize = require('../config/connection');

const ResetPasswordToken = sequelize.define('resetpasswordtoken', {
		userId: Sequelize.STRING,
		token: Sequelize.STRING,
		expiresAt: Sequelize.DATE
	}, {
	classMethods: {
		associate: function(models) {
			resetpasswordtoken.belongsTo(models.User, {
				as: "user",
				foreignKey: "userId",
				foreignKeyConstraint: true
			});
		}
	}
});

module.exports = ResetPasswordToken;
