let AuthAPI = require("./server/auth");
const express = require("express");

function init() {
  let api = express();

  api.use("/auth", AuthAPI());

  return api;
}

module.exports = {
  init: init,
};
