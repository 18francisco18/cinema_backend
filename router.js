let AuthAPI = require("./server/auth");
const express = require("express");

function init() {
  let api = express();

  api.get("/auth", AuthAPI());

  return api;
}

module.exports = {
  init: init,
};
