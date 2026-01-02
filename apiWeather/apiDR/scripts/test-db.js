console.log(' TESTANDO CONEXÃO COM BANCO DE DADOS\n');

require('dotenv').config();

const mysql = require('mysql2/promise');

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'farm_db'
  };

  console.log(' Configuração:');
  console.log('   Host:', config.host);
  console.log('   Porta:', config.port);
  console.log('   Usuário:', config.user);
  console.log('   Banco:', config.database);
  console.log('   Senha:', config.password ? '***' : '(vazia)');

  try {
    const connection = await mysql.createConnection(config);
    console.log('\n CONEXÃO BEM-SUCEDIDA!');

    // Testa se as tabelas existem
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n TABELAS ENCONTRADAS (${tables.length}):`);

    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   • ${tableName}`);
    });

    // Verifica tabelas específicas do sistema
    const tableNames = tables.map(t => Object.values(t)[0]);
    const requiredTables = ['info_ambiente', 'lavoura'];

    console.log('\n VERIFICAÇÃO DE TABELAS REQUERIDAS:');
    requiredTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`    ${table}: OK`);
      } else {
        console.log(`    ${table}: NÃO ENCONTRADA`);
      }
    });

    await connection.end();

  } catch (error) {
    console.error('\n ERRO NA CONEXÃO:', error.message);
    console.log('\n SUGESTÕES:');
    console.log('   1. Verifique se o MySQL está rodando');
    console.log('   2. Confira usuário e senha no arquivo .env');
    console.log('   3. Verifique se o banco "farm_db" existe');
    console.log('   4. Teste manualmente: mysql -u root -p');
  }
}

testConnection();