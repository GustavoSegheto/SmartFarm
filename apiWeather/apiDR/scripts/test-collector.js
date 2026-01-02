require('dotenv').config();
const { testConnection } = require('../database/connection.js');
const weatherCollector = require('../services/weather-collector.service.js');

async function testCollector() {
    try {
        console.log(' TESTE MANUAL DO COLETOR\n');
        
        // 1. Testa conexão
        console.log('1. Testando conexão com banco...');
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Falha na conexão com MySQL');
        }
        console.log('    Conectado ao farm_db\n');
        
        // 2. Verifica estatísticas atuais
        console.log('2. Estatísticas atuais:');
        const stats = await weatherCollector.getStats();
        console.log(`   • Total registros: ${stats.total_records}`);
        console.log(`   • Registros hoje: ${stats.today_records}`);
        console.log(`   • Última coleta: ${stats.last_collection || 'Nenhuma'}\n`);
        
        // 3. Executa coleta manual
        console.log('3. Executando coleta manual...');
        const result = await weatherCollector.collectAll();
        
        if (result.success) {
            console.log(`\n COLETA BEM-SUCEDIDA!`);
            console.log(`   • Lavouras processadas: ${result.stats.total}`);
            console.log(`   • Coletas bem-sucedidas: ${result.stats.success}`);
            console.log(`   • Falhas: ${result.stats.failed}`);
            
            // Mostra resultados individuais
            console.log('\n📝 Resultados por lavoura:');
            result.results.forEach(r => {
                if (r.success) {
                    console.log(`    Lavoura ${r.lavoura_id}: ${r.temperatura}°C, ${r.clima}`);
                } else {
                    console.log(`    Lavoura ${r.lavoura_id}: ${r.error}`);
                }
            });
        } else {
            console.log(`\n COLETA FALHOU: ${result.error}`);
        }
        
        // 4. Verifica estatísticas atualizadas
        console.log('\n4. Estatísticas atualizadas:');
        const newStats = await weatherCollector.getStats();
        console.log(`   • Total registros: ${newStats.total_records} (+${newStats.total_records - stats.total_records})`);
        console.log(`   • Registros hoje: ${newStats.today_records}`);
        
        console.log('\n TESTE CONCLUÍDO!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n ERRO NO TESTE:', error.message);
        process.exit(1);
    }
}

testCollector();