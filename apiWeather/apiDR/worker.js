// WORKER PRINCIPAL DO SISTEMA DE COLETA
require('dotenv').config();

// Importa módulos
const { testConnection } = require('./database/connection');
const WeatherCollector = require('./services/weather-collector.service.js');
const cron = require('node-cron');

async function startSystem() {
  console.log('\n🔧 INICIANDO SISTEMA...\n');
  
  try {
    // 1. Testa conexão com MySQL
    console.log('1. Testando conexão com banco...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Falha na conexão com MySQL');
    }
    console.log('    Banco conectado\n');
    
    // 2. Verifica chave OpenWeather
    console.log('2. Verificando API OpenWeather...');
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY.includes('sua_chave')) {
      console.log('     ATENÇÃO: OPENWEATHER_API_KEY não configurada');
      console.log('    Configure no arquivo .env\n');
    } else {
      console.log('    Chave API configurada\n');
    }
    
    // 3. Verifica lavouras no banco
    console.log('3. Verificando lavouras...');
    const lavouras = await WeatherCollector.getLavoursFromDatabase();
    if (lavouras.length === 0) {
      console.log('     Nenhuma lavoura com coordenadas encontrada');
      console.log('    Insira dados na tabela lavoura:\n');
      console.log('      INSERT INTO lavoura (latitude, longitude, nome_lavoura)');
      console.log('      VALUES (-23.5505, -46.6333, "Fazenda São Paulo");\n');
    } else {
      console.log(`    ${lavouras.length} lavoura(s) encontrada(s)\n`);
    }
    
    // 4. Configura agendamento automático
    console.log('4. Configurando agendamento...');
    setupScheduler();
    
    // 5. Mostra estatísticas iniciais
    console.log('5. Estatísticas atuais:');
    const stats = await WeatherCollector.getStats();
    console.log(`    Total de registros: ${stats.total_records || 0}`);
    console.log(`    Registros hoje: ${stats.today_records || 0}`);
    if (stats.last_collection) {
      console.log(`    Última coleta: ${new Date(stats.last_collection).toLocaleString('pt-BR')}`);
    }
    
    // 6. Mantém o sistema rodando
    console.log('\n SISTEMA INICIADO COM SUCESSO!');
    console.log('\n AGENDAMENTO CONFIGURADO PARA:');
    console.log('   06:00, 12:00, 18:00 (horário de Brasília)');
    console.log('\n COMANDOS DISPONÍVEIS:');
    console.log('   • Para coleta manual: npm run collect-now');
    console.log('   • Para estatísticas: npm run stats');
    console.log('\n PARA PARAR: Pressione Ctrl + C');
    
    // Mantém processo vivo
    keepAlive();
    
  } catch (error) {
    console.error('\n ERRO AO INICIAR SISTEMA:', error.message);
    console.log('\n🔧 SOLUÇÕES:');
    console.log('   1. Verifique se MySQL está rodando');
    console.log('   2. Confira o arquivo .env');
    console.log('   3. Execute: npm run test-db');
    process.exit(1);
  }
}

/**
 * Configura agendamento automático
 */
function setupScheduler() {
  // Coleta às 6h, 12h, 18h (horário de Brasília)
  cron.schedule('0 6 * * *', () => {
    console.log('\n GATILHO: Coleta das 06:00');
    runCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  cron.schedule('0 12 * * *', () => {
    console.log('\n GATILHO: Coleta das 12:00');
    runCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  cron.schedule('0 15 * * *', () => {
    console.log('\n GATILHO: Coleta das 15:00');
    runCollection();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  console.log('    Agendador configurado: 06:00, 12:00, 18:00');
}

/**
 * Executa uma coleta
 */
async function runCollection() {
  console.log(' EXECUTANDO COLETA AUTOMÁTICA...');
  console.log(new Date().toLocaleString('pt-BR'));
  await WeatherCollector.collectForAllLavours();
}

/**
 * Mantém o processo vivo
 */
function keepAlive() {
  // Apenas mantém o processo rodando
  setInterval(() => {
    // Verificação periódica (a cada 5 minutos)
    const now = new Date();
    if (now.getMinutes() % 5 === 0) {
      console.log(`\n Sistema ativo: ${now.toLocaleTimeString('pt-BR')}`);
    }
  }, 60000); // 1 minuto
}

// Inicia o sistema
startSystem();