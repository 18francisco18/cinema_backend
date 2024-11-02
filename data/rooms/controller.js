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

async function createRoom(req, res) {
  try {
    const room = req.body;
    const newRoom = await roomService.create(room);
    res.status(201).send(newRoom);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// Controlador para buscar uma sala pelo id
async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await roomService.findById(id);
    res.status(200).send(room);
  } catch (error) {
    console.log(error);
    // Caso o erro deva-se ao facto de não encontrar o id, transmite o erro 404.
    if (error.message === "Room not found") {
      res.status(404).json({ error: error.message });
    } else {
      // Caso o problema seja algo que não seja o id não encontrado, transmite o erro 500.
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

// Controlador para buscar todas as salas
async function getAllRooms(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const rooms = await roomService.findAll(page, limit);
    res.status(200).send(rooms);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

async function removeRoomById(req, res) {
  try {
    const { id } = req.params;
    await roomService.removeById(id);
    res.status(204).send();
    console.log("Room removed");
  } catch (error) {
    // Caso o erro deva-se ao facto de não encontrar o id, transmite o erro 404.
    if (error.message === "Room not found") {
      res.status(404).json({ error: error.message });
    } else {
      // Caso o problema seja algo que não seja o id não encontrado, transmite o erro 500.
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

async function updateRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = req.body;
    const updatedRoom = await roomService.updateById(id, room);
    res.status(200).send(updatedRoom);
  } catch (error) {
    // Caso o erro deva-se ao facto de não encontrar o id, transmite o erro 404.
    if (error.message === "Room not found") {
      res.status(404).json({ error: error.message });
    } else {
      // Caso o problema seja algo que não seja o id não encontrado, transmite o erro 500.
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

async function updateSeatStatus(req, res) {
  try {
    const { id } = req.params;
    const seat = req.body;
    const updatedRoom = await roomService.updateSeatStatus(id, seat);
    res.status(200).send(updatedRoom);
  } catch(error) {
    if (error.message === "Room not found") {
      res.status(404).json({ error: "Room not found" });
    } 

    if (error.message === "Invalid seat status") {
      res.status(404).json({ error: "Invalid seat status" });
    } 

    if (error.message === "Invalid seat number") {
      res.status(404).json({ error: "Invalid seat number" });
    } 

    res.status(500).json({ error: "Internal Server Error" });

  }
}

module.exports = roomController;
