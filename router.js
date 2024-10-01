let UsersAPI = require('./server/users');
let MoviesAPI = require('./server/movies');
const express = require('express');
let AuthAPI = require("./server/auth");


function init() {
  let api = express();

    api.use('/users', UsersAPI());
    api.use('/movies', MoviesAPI());
    api.use("/auth", AuthAPI());

  return api;
}

module.exports = {
  init: init,
};
