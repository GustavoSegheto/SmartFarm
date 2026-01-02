const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection.js');

const Lavoura = sequelize.define('Lavoura', {
    ID_lavoura: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        field: 'ID_lavoura'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 6),
        field: 'latitude'
    },
    longitude: {
        type: DataTypes.DECIMAL(10, 6),
        field: 'longitude'
    },
    apelido_sensor: {
        type: DataTypes.STRING(50),
        field: 'apelido_sensor'
    }
}, {
    tableName: 'lavoura',
    timestamps: false,
    underscored: false
});

// Método para buscar apenas coordenadas
Lavoura.getCoordinates = async function() {
    return await this.findAll({
        attributes: ['ID_lavoura', 'latitude', 'longitude', 'apelido_sensor'],
        where: {
            latitude: { [sequelize.Op.not]: null },
            longitude: { [sequelize.Op.not]: null }
        }
    });
};

module.exports = Lavoura;