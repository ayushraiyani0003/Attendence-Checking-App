module.exports = (sequelize, DataTypes) => {
    const Designation = sequelize.define('designation', {
      designation_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
  
    return Designation;
  };
  