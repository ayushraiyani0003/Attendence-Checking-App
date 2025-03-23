// models/Audit.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Audit = sequelize.define(
    "Audit",
    {
      audit_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      table_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      changed_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      changed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      old_data: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        get() {
          const raw = this.getDataValue("old_data");
          return raw ? JSON.parse(raw) : null;
        },
        set(value) {
          this.setDataValue("old_data", JSON.stringify(value));
        },
      },
      new_data: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        get() {
          const raw = this.getDataValue("new_data");
          return raw ? JSON.parse(raw) : null;
        },
        set(value) {
          this.setDataValue("new_data", JSON.stringify(value));
        },
      },
    },
    {
      tableName: "Audit",
      timestamps: false,
      underscored: true,
    }
  );

  return Audit;
};
