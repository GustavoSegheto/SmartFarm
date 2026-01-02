const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection.js');

// Modelo EXATO da sua tabela info_ambiente
const InfoAmbiente = sequelize.define('InfoAmbiente', {
  ID_info_amb: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    field: 'ID_info_amb'
  },
  data_leitura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'data_leitura'
  },
  umid_ar: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'umid_ar'
  },
  temp_ar: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'temp_ar'
  },
  vel_vento: {
    type: DataTypes.DECIMAL(6, 2),
    field: 'vel_vento'
  },
  pluviosidade: {
    type: DataTypes.DECIMAL(6, 2),
    field: 'pluviosidade'
  },
  fotoperiodo: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'fotoperiodo'
  },
  clima: {
    type: DataTypes.STRING(120),
    field: 'clima'
  }
}, {
  tableName: 'info_ambiente',
  timestamps: false // Sua tabela não tem created_at/updated_at
});

console.log('✅ Modelo InfoAmbiente criado');

module.exports = InfoAmbiente;