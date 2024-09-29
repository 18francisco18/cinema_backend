const Room = require("./rooms");
const RoomsService = require("./service");

const roomService = RoomsService(Room);
module.exports = roomService;
