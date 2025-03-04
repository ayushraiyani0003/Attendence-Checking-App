module.exports = (sequelize, DataTypes) => {
    const ReportingGroup = sequelize.define('ReportingGroup', {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,  // Marking id as the primary key
      },
      groupname: {
        type: DataTypes.STRING,
        allowNull: false,  // groupname cannot be null
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,  // Default value as the current timestamp
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,  // Default value as the current timestamp
        onUpdate: DataTypes.NOW,      // Automatically updates to the current timestamp on update
      },
    }, {
      tableName: 'reporting_group',  // Specifying the table name explicitly (optional)
      timestamps: false,             // Disable Sequelize's automatic timestamps since we're defining custom columns
    });
  
    return ReportingGroup;
  };
  