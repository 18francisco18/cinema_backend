let UsersAPI = require('./server/users');
const express = require('express');

function init (){
    let api = express();

    api.get('/users', UsersAPI());

    return api;
}

module.exports = {
    init: init
}