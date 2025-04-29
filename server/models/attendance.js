module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      attendance_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      shift_type: {
        type: DataTypes.STRING(11),
        allowNull: true,
      },
      network_hours: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      overtime_hours: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "Attendance",
      timestamps: true,
      underscored: true,

      // Add this part for indexes
      indexes: [
        {
          name: "attendance_date_employee_id_idx",
          fields: ["attendance_date", "employee_id"],
        },
      ],
    }
  );

  return Attendance;
};
