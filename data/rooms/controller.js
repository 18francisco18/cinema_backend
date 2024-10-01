const roomService = require('../rooms');
const roomModel = require('../rooms/rooms');

const roomController = {
    createRoom,

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







module.exports = roomController;