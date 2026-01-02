const mysql = require('mysql2/promise');
require('dotenv').config();

class WeatherCollectorService {
  constructor() {
    this.isCollecting = false;
  }

  /**
   * COLETA PRINCIPAL - Para TODAS as lavouras
   */
  async collectForAllLavours() {
    if (this.isCollecting) {
      console.log('  Coleta já em andamento...');
      return { error: 'Já coletando' };
    }

    this.isCollecting = true;
    console.log('\n INICIANDO COLETA METEOROLÓGICA');
    
    try {
      // 1. Busca lavouras
      const lavouras = await this.getLavoursFromDatabase();
      
      if (lavouras.length === 0) {
        console.log(' Nenhuma lavoura encontrada');
        console.log(' Insira lavouras com: INSERT INTO lavoura (latitude, longitude, apelido_sensor) VALUES (-23.5505, -46.6333, "Fazenda Teste");');
        return { error: 'Sem lavouras' };
      }
      
      console.log(` ${lavouras.length} lavoura(s) encontrada(s)`);
      
      // 2. Para cada lavoura, coleta e salva
      let successCount = 0;
      for (const lavoura of lavouras) {
        const success = await this.collectAndSave(lavoura);
        if (success) successCount++;
        await this.sleep(2000); // Pausa entre coletas
      }
      
      console.log(`\nRELATÓRIO: ${successCount}/${lavouras.length} coletas bem-sucedidas`);
      console.log(' COLETA CONCLUÍDA!');
      return { success: true, count: successCount };
      
    } catch (error) {
      console.error(' ERRO NA COLETA:', error.message);
      return { error: error.message };
    } finally {
      this.isCollecting = false;
    }
  }
  
  /**
   * Coleta e salva dados de UMA lavoura
   */
  async collectAndSave(lavoura) {
    try {
      console.log(`\n🌾 Processando: ${lavoura.apelido_sensor || 'Lavoura ' + lavoura.ID_lavoura}`);
      
      // Coleta dados da API
      const weatherData = await this.getWeatherFromAPI(lavoura.latitude, lavoura.longitude);
      
      // Salva no banco
      await this.saveToDatabase(weatherData);
      
      console.log(`    Salvo: ${weatherData.temp_ar}°C, ${weatherData.clima}`);
      return true;
      
    } catch (error) {
      console.log(`    Erro: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Coleta dados da OpenWeather API
   */
  async getWeatherFromAPI(latitude, longitude) {
    const axios = require('axios');
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey || apiKey.includes('sua_chave')) {
      throw new Error('Chave OpenWeather não configurada no .env');
    }
    
    console.log(`   📡 Consultando API para (${latitude}, ${longitude})...`);
    
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: latitude,
        lon: longitude,
        appid: apiKey,
        units: 'metric',
        lang: 'pt_br'
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    return {
      temp_ar: data.main.temp,
      umid_ar: data.main.humidity,
      vel_vento: data.wind.speed * 3.6, // m/s → km/h
      pluviosidade: data.rain?.['1h'] || 0,
      fotoperiodo: this.calculateDaylight(data.sys.sunrise, data.sys.sunset),
      clima: data.weather[0]?.description || 'Desconhecido'
    };
  }
  
  /**
   * Salva dados no banco
   */
  async saveToDatabase(weatherData) {
    const connection = await this.getConnection();
    
    await connection.execute(
      `INSERT INTO info_ambiente 
       (temp_ar, umid_ar, vel_vento, pluviosidade, fotoperiodo, clima, data_leitura) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        weatherData.temp_ar,
        weatherData.umid_ar,
        weatherData.vel_vento,
        weatherData.pluviosidade,
        weatherData.fotoperiodo,
        weatherData.clima
      ]
    );
    
    await connection.end();
  }
  
  /**
   * Busca lavouras do banco
   */
  async getLavoursFromDatabase() {
    try {
      const connection = await this.getConnection();
      
      const [rows] = await connection.execute(`
        SELECT ID_lavoura, latitude, longitude, apelido_sensor 
        FROM lavoura 
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
      `);
      
      await connection.end();
      return rows;
      
    } catch (error) {
      console.error(' Erro ao buscar lavouras:', error.message);
      return [];
    }
  }
  
  /**
   * Cria conexão com o banco
   */
  async getConnection() {
    return await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'farm_db'
    });
  }
  
  /**
   * Calcula horas de luz do dia
   */
  calculateDaylight(sunriseTimestamp, sunsetTimestamp) {
    const sunrise = new Date(sunriseTimestamp * 1000);
    const sunset = new Date(sunsetTimestamp * 1000);
    const diffHours = (sunset - sunrise) / (1000 * 60 * 60);
    return parseFloat(diffHours.toFixed(2));
  }
  
  /**
   * Coleta única para testes
   */
  async collectSingle(latitude, longitude, locationName = 'Teste') {
    try {
      console.log(` Coleta teste para ${locationName}...`);
      
      const weatherData = await this.getWeatherFromAPI(latitude, longitude);
      await this.saveToDatabase(weatherData);
      
      console.log(` Dados salvos: ${weatherData.temp_ar}°C, ${weatherData.clima}`);
      return { success: true, data: weatherData };
      
    } catch (error) {
      console.error(' Erro:', error.message);
      throw error;
    }
  }
  
  /**
   * Estatísticas do banco - VERSÃO CORRIGIDA
   */
  async getStats() {
    try {
      const connection = await this.getConnection();
      
      // Total de registros
      const [totalResult] = await connection.execute('SELECT COUNT(*) as total FROM info_ambiente');
      const total = totalResult[0].total;
      
      // Registros hoje
      const [todayResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM info_ambiente WHERE DATE(data_leitura) = CURDATE()'
      );
      const today = todayResult[0].total;
      
      // Último registro
      const [lastResult] = await connection.execute(
        'SELECT * FROM info_ambiente ORDER BY data_leitura DESC LIMIT 1'
      );
      
      await connection.end();
      
      const lastRecord = lastResult[0];
      
      return {
        total_records: total,
        today_records: today,
        last_collection: lastRecord ? lastRecord.data_leitura : null,
        last_temperature: lastRecord ? lastRecord.temp_ar : null,
        last_weather: lastRecord ? lastRecord.clima : null
      };
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error.message);
      return {
        total_records: 0,
        today_records: 0,
        last_collection: null,
        last_temperature: null,
        last_weather: null
      };
    }
  }
  
  // Utilitário
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exporta UMA instância
const collector = new WeatherCollectorService();
module.exports = collector;