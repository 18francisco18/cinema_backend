let UsersAPI = require('./server/users');
let MoviesAPI = require('./server/movies');
const express = require('express');

function init (){
    let api = express();

    api.use('/users', UsersAPI());
    api.use('/movies', MoviesAPI());

    return api;
}

module.exports = {
    init: init
}