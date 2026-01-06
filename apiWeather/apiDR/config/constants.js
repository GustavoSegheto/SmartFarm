module.exports = {
    // OpenWeather (OBRIGATÓRIO)
    OPENWEATHER: {
        API_KEY: process.env.OPENWEATHER_API_KEY || 'b3202594d2e871939ec05498c65f3b28'
    },
    
    // MySQL (AJUSTE PARA SUAS CREDENCIAIS)
    DB_CONFIG: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'farm_db',  // SEU banco
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || 'root',
        logging: process.env.DB_LOGGING === 'true'
    }
};