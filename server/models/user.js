const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust this path to your DB connection

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,  // Ensure unique constraint
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_no: {
    type: DataTypes.STRING(15),  // Adjust to match the phone number field size
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
  },
  last_login: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,  // Uses current timestamp
  },
  is_active: {
    type: DataTypes.TINYINT(1),
    defaultValue: 1,  // Default is 1 (active)
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assigned_departments: {
    type: DataTypes.TEXT('long'),  // Using longtext for larger JSON strings
    allowNull: true,
    defaultValue: '[]',  // Default to an empty JSON array
    validate: {
      isJson(value) {
        if (value && !this.isValidJson(value)) {
          throw new Error('Assigned departments must be a valid JSON string.');
        }
      }
    },
    set(value) {
      // Ensure value is stored as a valid JSON string
      this.setDataValue('assigned_departments', JSON.stringify(value));
    },
    get() {
      // Ensure value is returned as a valid JavaScript array
      const value = this.getDataValue('assigned_departments');
      try {
        return JSON.parse(value);
      } catch (e) {
        return [];
      }
    },
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Hash password before saving user to the database
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.prototype.isValidJson = function(value) {
  try {
    JSON.parse(value);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = User;
