const { AppError } = require('../AppError');
const logger = require('../logger'); // Adicione um logger configurado

const errorHandler = (err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack }); // Log detalhado com stack trace

    if (err instanceof AppError && err.isOperational) {
        res.status(err.httpCode).json({ error: err.message });
    } else {
        // Erros não operacionais são considerados erros internos do servidor
        res.status(AppError.HttpCode.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
    }
};

module.exports = errorHandler;