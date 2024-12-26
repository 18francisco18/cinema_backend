const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const CORS = require("cors");
const cookieParser = require('cookie-parser');
const sessionService = require("./data/sessions");
const discountService = require("./data/discounts");
const apiVersion = process.env.API_VERSION || 'v1';
const errorHandler = require(`./middleware/errorHandler`);
const path = require('path');

console.log('Starting application...');
console.log('Environment variables:', {
    API_VERSION: process.env.API_VERSION,
    MONGODB_URI: process.env.MONGODB_URI ? '[REDACTED]' : 'not set',
    MOVIE_API_BASE_URL: process.env.MOVIE_API_BASE_URL,
    MOVIE_API_KEY: process.env.MOVIE_API_KEY ? '[REDACTED]' : 'not set',
    NODE_ENV: process.env.NODE_ENV
});

const config = require("./config");
console.log('Config loaded:', {
    db: config.db ? '[REDACTED]' : 'not set',
    MOVIE_API_BASE_URL: config.MOVIE_API_BASE_URL,
    API_VERSION: config.API_VERSION
});

mongoose
  .connect(config.db)
  .then(() => console.log("MongoDB Connection successful!"))
  .catch((err) => {
    console.error("MongoDB Connection error:", err);
    process.exit(1); // Exit if cannot connect to MongoDB
  });

// Importar o router do local correto
console.log('Loading router...');
const router = require(`./server/v1/router`);
console.log('Router loaded successfully');

var app = express();

// Limitador de requisições
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
});

// Configuração do CORS
const allowedOrigins = [
  'http://localhost:4000',
  'https://cinema-backend-app.azurewebsites.net',
  'https://cinema-frontend-app.azurewebsites.net'
];

app.use(CORS({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  credentials: true
}));

// Middleware para cookies e JSON
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use(router.init(`/api/${apiVersion}`));
app.use(limiter);

// Cron job que verifica e atualiza estados das sessões a cada 5 minutos
// ATENÇÃO: A razão do uso do node-cron é explicada no arquivo service.js de sessions,
// na função checkAndUpdateSessions().  
cron.schedule('*/5 * * * *', () => {
  console.log('Verificando e atualizando sessões...');
  sessionService.checkAndUpdateSessions();
});

cron.schedule('*/5 * * * *', () => {
  console.log('Verificando por sessões expiradas...');
  sessionService.deleteSessions();
});

cron.schedule('0 * * * *', () => {
  console.log('Verificando por descontos fora da validade...');
  discountService.checkForExpiredDiscounts();
});

app.use(errorHandler)

// Iniciar o servidor
const port = process.env.PORT || 8080;
const host = '0.0.0.0';
console.log(`Attempting to start server on ${host}:${port}...`);

app.listen(port, host, () => {
    console.log(`Server is running on ${host}:${port}`);
    console.log(`API Version: ${apiVersion}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
