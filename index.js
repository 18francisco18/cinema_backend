const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cron = require("node-cron");
const CORS = require("cors");
const cookieParser = require('cookie-parser');
const sessionService = require("./data/sessions");
const discountService = require("./data/discounts");
const apiVersion = process.env.API_VERSION;
const errorHandler = require(`./middleware/errorHandler`);

const config = require("./config");

const hostname = "127.0.0.1";
const port = 3000;

mongoose
  .connect(config.db)
  .then(() => console.log("Connection successful!"))
  .catch((err) => console.error(err));

let router = require(`./server/${apiVersion}/router`);
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
  'https://your-frontend-app.azurewebsites.net' // Add your Azure frontend URL when deployed
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
const server = http.Server(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port} with API version: ${apiVersion}`);
});
