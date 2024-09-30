const express = require("express");
const http = require("http");
const mongoose = require("mongoose");

const config = require("./config");

const hostname = "127.0.0.1";
const port = 3000;

mongoose
  .connect(config.db)
  .then(() => console.log("Conection successful!"))
  .catch((err) => console.error(err));

let router = require("./router");
var app = express();
app.use(router.init());

const server = http.Server(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});
