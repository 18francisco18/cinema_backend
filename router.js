let UsersAPI = require("./server/auth");
let MoviesAPI = require("./server/movies");
const express = require("express");
let AuthAPI = require("./server/auth");
let CinemaAPI = require("./server/cinema");
let RoomsAPI = require("./server/rooms");
let BookingAPI = require("./server/booking");
let PasswordAPI = require("./server/password");

function init() {
  let api = express();

  api.use("/users", UsersAPI());
  api.use("/movies", MoviesAPI());
  api.use("/auth", AuthAPI());
  api.use("/password", PasswordAPI());
  api.use("/cinemas", CinemaAPI());
  api.use("/rooms", RoomsAPI());
  api.use("/bookings", BookingAPI());

  return api;
}

module.exports = {
  init: init,
};
