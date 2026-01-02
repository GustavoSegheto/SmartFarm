const cron = require('node-cron');
const weatherCollector = require('../services/weather-collector.service.js');

class WeatherScheduler {
    constructor() {
        this.jobs = [];
        this.isRunning = false;
    }

    /**
     * Inicia o agendador
     * Coleta nos horários: 06:00, 12:00, 18:00
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Agendador já está rodando');
            return;
        }

        console.log('⏰ CONFIGURANDO AGENDADOR...');
        console.log('📅 Horários: 06:00, 12:00, 18:00 (Brasília)');
        
        // Agendamentos
        this.scheduleJob('coleta-6h', '0 6 * * *', 'Coleta das 06:00');
        this.scheduleJob('coleta-12h', '0 12 * * *', 'Coleta das 12:00');
        this.scheduleJob('coleta-18h', '0 18 * * *', 'Coleta das 18:00');
        
        // Para testes em desenvolvimento: a cada 5 minutos
        if (process.env.NODE_ENV === 'development') {
            this.scheduleJob('teste-5min', '*/5 * * * *', 'Coleta de teste (5min)');
        }
        
        this.isRunning = true;
        console.log('✅ Agendador iniciado!');
    }

    stop() {
        console.log('🛑 Parando agendador...');
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
        this.isRunning = false;
        console.log('🛑 Agendador parado');
    }

    scheduleJob(name, cronExpression, description) {
        const job = cron.schedule(cronExpression, async () => {
            console.log(`\n🎯 ${description}`);
            console.log(`⏰ ${new Date().toLocaleString('pt-BR')}`);
            
            try {
                const result = await weatherCollector.collectAll();
                
                if (result.success) {
                    console.log(`✅ Coleta concluída: ${result.stats.success}/${result.stats.total} sucessos`);
                } else {
                    console.log(`❌ Coleta falhou: ${result.error}`);
                }
            } catch (error) {
                console.error(`💥 Erro no job ${name}:`, error.message);
            }
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });

        this.jobs.push(job);
        console.log(`   ⏰ ${name}: ${cronExpression} (${description})`);
    }

    /**
     * Executa coleta IMEDIATAMENTE (para testes)
     */
    async runNow() {
        console.log('🚀 EXECUTANDO COLETA MANUAL...');
        return await weatherCollector.collectAll();
    }
}

module.exports = new WeatherScheduler();