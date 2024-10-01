

function roomService() {
    let service = {
        create,
        findAll,
        findById,
        findRoom,
        removeById,
        update,
        deleteRoom,
    };

    function create(room) {
        let newRoom = new RoomModel(room);
        return save(newRoom);
    }

    function save(newRoom) {
        return new Promise((resolve, reject) => {
            newRoom.save((err, savedRoom) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(savedRoom);
                }
            });
        });
    }

    function findAll() {
        return new Promise((resolve, reject) => {
            RoomModel.find({}, (err, rooms) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rooms);
                }
            });
        });
    }

    function findById(id) {
        return RoomModel.findById(id).then((room) => {
            if (!room) {
                return Promise.reject("Room not found");
            }
            return room;
        }).catch((err) => {
            return Promise.reject("Error fetching room");
        });
    }

    return service;
}

module.exports = roomService;