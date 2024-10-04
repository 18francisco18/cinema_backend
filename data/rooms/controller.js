const roomService = require('../rooms');
const roomModel = require('../rooms/rooms');

const roomController = {
    createRoom,
    getRoomById,
    getAllRooms,
    removeRoomById,
};

async function createRoom(req, res) {
    try {
        const room = req.body;
        const newRoom = await roomService.create(room);
        res.status(201).send(newRoom);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
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
        res.status(500).send(error);

    }
}

// Controlador para buscar todas as salas
async function getAllRooms(req, res) {
    try {
        const rooms = await roomService.findAll();
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
        console.log(error);
        res.status(500).send(error);
    }
}

module.exports = roomController;