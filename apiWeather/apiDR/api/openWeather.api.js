const axios = require('axios');
require('dotenv').config();

class OpenWeatherAPI {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    if (!this.apiKey || this.apiKey.includes('sua_chave')) {
      console.error('❌ ERRO: OPENWEATHER_API_KEY não configurada no .env');
      console.log('💡 Obtenha em: https://home.openweathermap.org/api_keys');
    }
  }

  /**
   * Coleta dados meteorológicos para uma coordenada
   * Retorna no formato da tabela info_ambiente
   */
  async getWeatherData(latitude, longitude) {
    try {
      console.log(`📍 Consultando OpenWeather para (${latitude}, ${longitude})...`);
      
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.apiKey,
          units: 'metric',      // Celsius
          lang: 'pt_br'         // Português
        },
        timeout: 10000 // 10 segundos
      });
      
      const data = response.data;
      
      // Formata para o SEU banco (tabela info_ambiente)
      const formattedData = {
        umid_ar: data.main.humidity,           // Umidade do ar
        temp_ar: data.main.temp,               // Temperatura do ar
        vel_vento: data.wind.speed * 3.6,      // m/s → km/h
        pluviosidade: data.rain?.['1h'] || 0,  // Chuva última hora (mm)
        fotoperiodo: this.calculateDaylight(data.sys.sunrise, data.sys.sunset),
        clima: data.weather[0]?.description || 'Desconhecido'
      };
      
      console.log(`✅ ${data.name}: ${formattedData.temp_ar}°C, ${formattedData.clima}`);
      return formattedData;
      
    } catch (error) {
      console.error(`❌ Erro na API OpenWeather:`, error.message);
      if (error.response?.status === 401) {
        console.error('   🔑 Chave API inválida! Verifique OPENWEATHER_API_KEY no .env');
      }
      throw error;
    }
  }
  
  /**
   * Calcula horas de luz do dia (fotoperíodo)
   */
  calculateDaylight(sunriseTimestamp, sunsetTimestamp) {
    const sunrise = new Date(sunriseTimestamp * 1000);
    const sunset = new Date(sunsetTimestamp * 1000);
    
    const diffMs = sunset - sunrise;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return parseFloat(diffHours.toFixed(2));
  }
}

module.exports = new OpenWeatherAPI();