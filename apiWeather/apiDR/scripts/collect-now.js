console.log(' COLETA MANUAL DE DADOS');
console.log('=========================\n');

require('dotenv').config();

// Importa o coletor real
const WeatherCollector = require('../services/weather-collector.service.js');

async function runManualCollection() {
  console.log(' Iniciando coleta manual...\n');
  
  try {
    // Executa a coleta REAL
    await WeatherCollector.collectForAllLavours();
    
    console.log('\n COLETA MANUAL CONCLUÍDA!');
    console.log('\n Verifique os dados no banco:');
    console.log('   SELECT * FROM info_ambiente ORDER BY data_leitura DESC;');
    
  } catch (error) {
    console.error('\n ERRO NA COLETA:', error.message);
  }
}

runManualCollection();