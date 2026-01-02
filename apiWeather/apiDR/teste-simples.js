// TESTE SIMPLES DO SEQUELIZE E .env
console.log('🧪 TESTE SIMPLES DO SISTEMA\n');

// 1. Carrega dotenv
try {
  require('dotenv').config();
  console.log('✅ dotenv carregado');
} catch (e) {
  console.log('❌ dotenv não instalado');
  process.exit(1);
}

// 2. Verifica variáveis
console.log('\n📋 VARIÁVEIS DO .env:');
console.log('DB_NAME:', process.env.DB_NAME || 'NÃO DEFINIDO');
console.log('DB_USER:', process.env.DB_USER || 'NÃO DEFINIDO');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_PASS:', process.env.DB_PASS ? '***' : '(vazia)');

// 3. Tenta carregar Sequelize
let Sequelize;
try {
  Sequelize = require('sequelize').Sequelize;
  console.log('\n✅ Sequelize carregado');
  console.log('Versão:', require('sequelize/package.json').version);
} catch (e) {
  console.log('\n❌ Sequelize NÃO instalado');
  console.log('Instale com: npm install sequelize mysql2');
  process.exit(1);
}

// 4. Tenta criar conexão
console.log('\n🔗 TESTANDO CONEXÃO...');
try {
  const sequelize = new Sequelize(
    process.env.DB_NAME || 'farm_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log
    }
  );
  
  // Testa conexão
  sequelize.authenticate()
    .then(() => {
      console.log('✅ CONEXÃO COM MYSQL BEM-SUCEDIDA!');
      console.log('\n🎉 TUDO FUNCIONANDO!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ ERRO NA CONEXÃO MYSQL:', err.message);
      console.log('\n🔧 VERIFIQUE:');
      console.log('   1. MySQL está rodando?');
      console.log('   2. Credenciais no .env estão corretas?');
      console.log('   3. Banco "farm_db" existe?');
      process.exit(1);
    });
    
} catch (e) {
  console.error('❌ ERRO AO CRIAR SEQUELIZE:', e.message);
  process.exit(1);
}