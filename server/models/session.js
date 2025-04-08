const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Adjust path to your DB connection

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // Your users table name
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  deviceId: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  indexes: [
    {
      name: 'idx_userId_isActive',
      fields: ['userId', 'isActive']
    }
  ]
});

// Clean up old sessions (optional)
// This can be a cron job or a scheduled task in your application
Session.cleanupOldSessions = async function() {
  const oneDaysAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  await Session.destroy({
    where: {
      [Sequelize.Op.or]: [
        { isActive: false },
        { lastActive: { [Sequelize.Op.lt]: oneDaysAgo } }
      ]
    }
  });
};

// Auto delete all sessions after 1 week
Session.cleanupWeekOldSessions = async function() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await Session.destroy({
    where: {
      createdAt: { [Sequelize.Op.lt]: oneWeekAgo }
    }
  });
};

module.exports = Session;