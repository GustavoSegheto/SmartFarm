// CONEXÃO OFICIAL DO SEU SISTEMA
const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔧 Configurando conexão com MySQL...');
console.log('   Banco:', process.env.DB_NAME);
console.log('   Host:', process.env.DB_HOST);
console.log('   Usuário:', process.env.DB_USER);

// Cria a conexão Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Mude para true se quiser ver as queries SQL
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Testa a conexão (pode ser chamada de outros arquivos)
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão MySQL:', error.message);
    return false;
  }
}

// Exporta para usar em todo o sistema
module.exports = {
  sequelize,
  testConnection
};