const CinemaModel = require('../cinema');
const seatStatus = require('./seatStatus');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");


function RoomService(roomModel) {
  let service = {
    create,
    findById,
    findAll,
    removeById,
    updateById,
    updateSeatStatus,
  };

  // Cria uma nova sala
  async function create(room) {
    try {
      let newRoom = new roomModel(room);
      let savedRoom = await newRoom.save({ functionName: "create" });

      await CinemaModel.findByIdAndUpdate(
        room.cinema,
        // empurra o id da nova sala sala para o array de salas do cinema
        { $push: { rooms: savedRoom._id } }
      );

      return savedRoom;
    } catch (error) {
      console.log(error);
      throw new DatabaseError(`Error creating room: ${error.message}`);
    }
  }

  // Encontra uma sala pelo id
  async function findById(id) {
    try {
      const room = await roomModel.findById(id);
      if (!room) throw new NotFoundError("Room not found");
      return room;
    } catch (err) {
      throw err;
    }
  }

  // Encontra todas as salas com paginação e filtros
  async function findAll(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;

      // Calcular o total de documentos com os filtros aplicados
      const total = await roomModel.countDocuments(filters);
      const totalPages = Math.ceil(total / limit);

      // Evitar lançamentos de erros desnecessários
      // Ao invés disso, retornar um objeto vazio caso a página
      // esteja fora dos limites.
      if (page > totalPages) {
        return { rooms: [], total: 0, page, limit };
      }

      // Buscar salas com lean para performance
      const rooms = await roomModel
        .find(filters)
        .limit(limit)
        .skip(skip)
        .lean();

      return {
        rooms,
        total,
        page,
        limit,
        pages: totalPages,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Remove uma sala pelo id
  async function removeById(id) {
    try {
      const room = await roomModel.findByIdAndDelete(id);
      if (!room) throw new NotFoundError("Room not found");
      return room;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Atualiza uma sala pelo id
  async function updateById(id, room) {
    try {
      const updatedRoom = await roomModel.findByIdAndUpdate(id, room, {
        new: true,
      });
      if (!updatedRoom) throw new NotFoundError("Room not found");
      return updatedRoom;
    } catch (err) {
      throw err;
    }
  }

  async function updateSeatStatus(id, seat) {
    try {
      const room = await roomModel.findById(id);
      if (!room) {
        throw new NotFoundError("Room not found");
      }

      // Verifica se o status do assento é válido
      const validStatuses = [seatStatus.inCondition, seatStatus.inaccessible];
      if (!validStatuses.includes(seat.status)) {
        throw new ValidationError("Invalid seat status");
      }

      let seatFound = false;

      // Atualiza o status do assento
      room.layout.forEach((row, rowIndex) => {
        row.forEach((currentSeat, seatIndex) => {
          if (currentSeat.number === seat.number) {
            room.layout[rowIndex][seatIndex].status = seat.status;
            seatFound = true;
          }
        });
      });

      if (!seatFound) {
        throw new ValidationError("Invalid seat number");
      }

      await room.save();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  return service;
}

module.exports = RoomService;