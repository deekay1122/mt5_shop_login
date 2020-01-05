const Sequelize = require('sequelize');
const sequelize = require('../config/connection');

const VerificationToken = sequelize.define('verificationtoken', {
		userId: Sequelize.STRING,
		token: Sequelize.STRING,
		expiresAt: Sequelize.DATE
	}, {
	classMethods: {
		associate: function(models) {
			verificationtoken.belongsTo(models.User, {
				as: "user",
				foreignKey: "userId",
				foreignKeyConstraint: true
			});
		}
	}
});

module.exports = VerificationToken;
