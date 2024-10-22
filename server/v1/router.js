
let UsersAPI = require("./auth");
let MoviesAPI = require("./movies");
const express = require("express");
let AuthAPI = require("./auth");
let CinemaAPI = require("./cinema");
let RoomsAPI = require("./rooms");
let BookingAPI = require("./booking");
let PasswordAPI = require("./password");
let SessionsAPI = require("./sessions");
let TicketsAPI = require("./tickets");

function init() {
  let api = express();

  api.use("/users", UsersAPI());
  api.use("/movies", MoviesAPI());
  api.use("/auth", AuthAPI());
  api.use("/password", PasswordAPI());
  api.use("/cinemas", CinemaAPI());
  api.use("/rooms", RoomsAPI());
  api.use("/bookings", BookingAPI());
  api.use("/sessions", SessionsAPI());
  api.use("/tickets", TicketsAPI());

  return api;
}

module.exports = {
  init: init,
};
