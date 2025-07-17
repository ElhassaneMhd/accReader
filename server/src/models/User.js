const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'client', 'pmta_user'),
    defaultValue: 'client'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  passwordChangedAt: {
    type: DataTypes.DATE
  },
  resetPasswordToken: {
    type: DataTypes.STRING
  },
  resetPasswordExpires: {
    type: DataTypes.DATE
  },
  // MailWizz specific fields
  mailwizzCustomerId: {
    type: DataTypes.STRING
  },
  mailwizzApiKey: {
    type: DataTypes.STRING
  },
  // PMTA specific fields
  pmtaAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pmtaServers: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      // Only hash the password if it has been modified (or is new)
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }

      // Set passwordChangedAt to current time if password was changed
      if (user.changed('password') && !user.isNewRecord) {
        user.passwordChangedAt = new Date();
      }
    }
  }
});

// Instance methods
User.prototype.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = User;
