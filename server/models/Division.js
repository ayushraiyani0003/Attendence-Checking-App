module.exports = (sequelize, DataTypes) => {
    const Division = sequelize.define("division", {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });

    return Division;
};
