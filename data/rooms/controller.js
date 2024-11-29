const roomService = require("../rooms");
const roomModel = require("../rooms/rooms");

const roomController = {
  createRoom,
  getRoomById,
  getAllRooms,
  removeRoomById,
  updateRoomById,
  updateSeatStatus,
};

async function createRoom(req, res, next) {
  try {
    const room = req.body;
    const newRoom = await roomService.create(room);
    res.status(201).send(newRoom);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para buscar uma sala pelo id
async function getRoomById(req, res, next) {
  try {
    const { id } = req.params;
    const room = await roomService.findById(id);
    res.status(200).send(room);
  } catch (error) {
    next(error);
  }
}

// Controlador para buscar todas as salas com paginação e filtragem
async function getAllRooms(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // Adicionar filtros de consulta
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: "i" }; // Filtro por nome (case-insensitive)
    }
    if (req.query.capacity) {
      filters.capacity = parseInt(req.query.capacity); // Filtro por capacidade
    }

    const result = await roomService.findAll(page, limit, filters);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function removeRoomById(req, res, next) {
  try {
    const { id } = req.params;
    await roomService.removeById(id);
    res.status(204).send();
    console.log("Room removed");
  } catch (error) {
    next(error);
  }
}

async function updateRoomById(req, res, next) {
  try {
    const { id } = req.params;
    const room = req.body;
    const updatedRoom = await roomService.updateById(id, room);
    res.status(200).send(updatedRoom);
  } catch (error) {
    next(error);
  }
}

async function updateSeatStatus(req, res, next) {
  try {
    const { id } = req.params;
    const seat = req.body;
    const updatedRoom = await roomService.updateSeatStatus(id, seat);
    res.status(200).send(updatedRoom);
  } catch(error) {
    next(error);
  }
}

module.exports = roomController;
