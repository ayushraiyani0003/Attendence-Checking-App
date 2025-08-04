const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Adjust this path to your DB connection

module.exports = (sequelize, DataTypes) => {
    const Employee = sequelize.define(
        "employees",
        {
            employee_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            department: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            punch_code: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },
            designation: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            reporting_group: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            net_hr: {
                type: DataTypes.FLOAT,
                allowNull: true,
                comment: "Net hours an employee works",
            },
            week_off: {
                type: DataTypes.STRING(100),
                allowNull: true,
                comment: "Weekly off days",
            },
            resign_date: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: "Date of resignation if applicable",
            },
            status: {
                type: DataTypes.ENUM(
                    "active",
                    "inactive",
                    "resigned",
                    "on_leave"
                ),
                defaultValue: "active",
                allowNull: false,
                comment: "Current employment status",
            },
            branch: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Branch location of the employee",
            },
            sections: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Sections or teams the employee belongs to",
            },
            mobile_number: {
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: "Employee mobile contact number",
            },
            whats_app_number: {
                type: DataTypes.STRING(20),
                allowNull: true,
                comment: "Employee whatsapp contact number",
            },
            division: {
                type: DataTypes.STRING(255),
                allowNull: true,
                comment: "Division the employee belongs to",
            },
        },
        {
            tableName: "employees",
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    name: "idx_punch_code",
                    fields: ["punch_code"],
                },
                {
                    name: "idx_reporting_group",
                    fields: ["reporting_group"],
                },
            ],
        }
    );

    return Employee;
};
