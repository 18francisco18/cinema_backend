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
let MerchandiseAPI = require("./merchandise");
let PromocodesAPI = require("./promocodes");

function init(prefix) {
  let api = express();

  api.use(`${prefix}/users`, UsersAPI());
  api.use(`${prefix}/movies`, MoviesAPI());
  api.use(`${prefix}/auth`, AuthAPI());
  api.use(`${prefix}/password`, PasswordAPI());
  api.use(`${prefix}/cinemas`, CinemaAPI());
  api.use(`${prefix}/rooms`, RoomsAPI());
  api.use(`${prefix}/bookings`, BookingAPI());
  api.use(`${prefix}/sessions`, SessionsAPI());
  api.use(`${prefix}/tickets`, TicketsAPI());
  api.use(`${prefix}/products`, ProductsAPI());
  api.use(`${prefix}/products/categories`, CategoriesAPI());
  api.use(`${prefix}/discounts`, DiscountsAPI());
  api.use(`${prefix}/points`, PointsAPI());
  api.use(`${prefix}/merchandise`, MerchandiseAPI());
  api.use(`${prefix}/discounts/promocodes`, PromocodesAPI());


  return api;
}

module.exports = {
  init: init,
};
