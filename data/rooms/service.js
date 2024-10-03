const CinemaModel = require('../cinema');

function RoomService(roomModel) {
    let service = {
        create,
        findById,
        findAll,
        removeById,
        updateById,
    };

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

    function findById(id) {
        return roomModel
            .findById(id)
            .then((room) => {
                if (!room) {
                    return Promise.reject("Room not found");
                }
                return room;
            })
            .catch((err) => {
                return Promise.reject("Error fetching room");
            });
    }

    function findAll() {
        return roomModel
            .find({})
            .then((rooms) => {
                return rooms;
            })
            .catch((err) => {
                return Promise.reject("Error fetching rooms");
            });
    }

    function removeById(id) {
        return roomModel
            .findByIdAndRemove(id)
            .then((room) => {
                if (!room) {
                    return Promise.reject("Room not found");
                }
                return room;
            })
            .catch((err) => {
                return Promise.reject("Error removing room");
            });
    }

    function updateById(id, room) {
        return roomModel
            .findByIdAndUpdate(id, room, { new: true })
            .then((room) => {
                if (!room) {
                    return Promise.reject("Room not found");
                }
                return room;
            })
            .catch((err) => {
                return Promise.reject("Error updating room");
            });
    }

    return service;
}

module.exports = RoomService;