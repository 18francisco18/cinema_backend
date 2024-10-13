const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cron = require("node-cron");
const sessionService = require("./data/sessions");

const config = require("./config");

const hostname = "127.0.0.1";
const port = 3000;

mongoose
  .connect(config.db)
  .then(() => console.log("Connection successful!"))
  .catch((err) => console.error(err));

let router = require("./router");
var app = express();
//app.use(express.json()); 
app.use(router.init());

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

const server = http.Server(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
