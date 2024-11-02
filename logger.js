const { createLogger, format, transports } = require('winston');

// Configura o formato do log (exibe a data, o nível do log e a mensagem)
const logger = createLogger({
    level: 'info', // Define o nível padrão como 'info'
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Adiciona timestamp
        format.printf(({ level, message, timestamp, stack }) => {
            return `${timestamp} ${level}: ${stack || message}`;
        })
    ),
    transports: [
        new transports.Console(), // Exibe logs no console
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Arquivo para logs de erro
        new transports.File({ filename: 'logs/combined.log' }) // Arquivo para todos os logs
    ]
});

module.exports = logger;