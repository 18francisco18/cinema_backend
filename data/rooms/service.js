const CinemaModel = require('../cinema/cinema');

function RoomService(roomModel) {
    let service = {
        create,
    };

    async function create(room) {
        try {
            let newRoom = new roomModel(room);
            let savedRoom = await newRoom.save();

            await CinemaModel.findByIdAndUpdate(
                room.cinema,
                { $push: { rooms: savedRoom._id } }
            );
            
            return savedRoom;
            
        } catch (error) {
            console.log(error);
            throw new Error(`Error creating room: ${error.message}`);
        }
    }

    return service
}

module.exports = RoomService;