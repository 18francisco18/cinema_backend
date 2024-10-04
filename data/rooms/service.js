const CinemaModel = require('../cinema');

function RoomService(roomModel) {
    let service = {
        create,
        findById,
        findAll,
        removeById,
        updateById,
    };

    // Cria uma nova sala
    async function create(room) {
        try {
            let newRoom = new roomModel(room);
            let savedRoom = await newRoom.save();

            await CinemaModel.findByIdAndUpdate(
                room.cinema,
                // empurra o id da nova sala sala para o array de salas do cinema
                { $push: { rooms: savedRoom._id } }
            );
            
            return savedRoom;
            
        } catch (error) {
            console.log(error);
            throw new Error(`Error creating room: ${error.message}`);
        }
    }

    // Encontra uma sala pelo id
    async function findById(id) {
        try {
            const room = await roomModel.findById(id);
            if (!room) {
                throw new Error("Room not found");
            }
            return room;
        } catch (err) {
            throw new Error("Error fetching room");
        }
    }

    // Encontra todas as salas
    async function findAll() {
        try {
            const rooms = await roomModel.find();
            return rooms;
        } catch (err) {
            throw new Error("Error fetching rooms");
        }
    }

    // Remove uma sala pelo id
    async function removeById(id) {
        try {
            const room = await roomModel.findByIdAndDelete(id);
            if (!room) {
                throw new Error("Room not found");
            }
            return room;
        } catch (err) {
            console.log(err);
            throw new Error("Error removing room");
        }
    }

    // Atualiza uma sala pelo id
    async function updateById(id, room) {
        try {
            const updatedRoom = await roomModel.findByIdAndUpdate(id, room, {
                new: true,
            });
            if (!updatedRoom) {
                throw new Error("Room not found");
            }
            return updatedRoom;
        }
        catch (err) {
            throw new Error("Error updating room");
        }
    }

    return service;
}

module.exports = RoomService;