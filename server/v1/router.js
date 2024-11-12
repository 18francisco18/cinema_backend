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
let ProductsAPI = require("./products");
let CategoriesAPI = require("./categories");
let DiscountsAPI = require("./discounts");
let PointsAPI = require("./points");

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
  api.use("/products", ProductsAPI());
  api.use("/products/categories", CategoriesAPI());
  api.use("/discounts", DiscountsAPI());
  api.use("/points", PointsAPI());

  return api;
}

module.exports = {
  init: init,
};
