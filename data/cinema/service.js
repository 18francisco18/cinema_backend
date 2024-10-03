function cinemaService(cinemaModel) {
  let service = {
    create,
    save,
    findAll,
    findById,
    findByIdAndUpdate,
    removeById,
    findRoomById,
    fillRoom,
    removeRoom,
    occupyRoom,
  };

  async function create(cinema) {
    try {
      let newCinema = new cinemaModel(cinema);
      return await save(newCinema);
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao criar cinema: ${error.message}`);
    }
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve("Cinema criado"))
        .catch((err) => reject(`Houve um problema ao criar o cinema ${err}`));
    });
  }

  async function findAll() {
    try {
      return await cinemaModel.find({});
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao buscar cinemas: ${error.message}`);
    }
  }

  async function findById(id) {
    try {
      return await cinemaModel.findById(id);
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao buscar cinema por id: ${error.message}`);
    }
  }

  async function findByIdAndUpdate(id, cinema) {
    try {
      return await cinemaModel.findByIdAndUpdate(id, cinema, { new: true });
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao atualizar cinema: ${error.message}`);
    }
  }

  function removeById(id) {
    return cinemaModel
      .findByIdAndRemove(id)
      .then((cinema) => {
        if (!cinema) {
          return Promise.reject("Cinema não encontrado");
        }
        return cinema;
      })
      .catch((err) => {
        return Promise.reject("Erro ao excluir cinema");
      });
  }

  function findRoomById(id) {
    return cinemaModel
      .findById(id)
      .populate("rooms")
      .then((cinema) => {
        if (!cinema) {
          return Promise.reject("Cinema não encontrado");
        }
        return cinema.rooms;
      })
      .catch((err) => {
        return Promise.reject("Erro ao buscar salas do cinema");
      });
  }

  function fillRoom(id, room) {
    return cinemaModel
      .findByIdAndUpdate(id, { $push: { rooms: room } }, { new: true })
      .then((cinema) => {
        if (!cinema) {
          return Promise.reject("Cinema não encontrado");
        }
        return cinema;
      })
      .catch((err) => {
        return Promise.reject("Erro ao adicionar sala ao cinema");
      });
  }

  function removeRoom(id, room) {
    return cinemaModel
      .findByIdAndUpdate(id, { $pull: { rooms: room } }, { new: true })
      .then((cinema) => {
        if (!cinema) {
          return Promise.reject("Cinema não encontrado");
        }
        return cinema;
      })
      .catch((err) => {
        return Promise.reject("Erro ao remover sala do cinema");
      });
  }

  function occupyRoom(id, room) {
    return cinemaModel
      .findByIdAndUpdate(
        { _id: id, "rooms._id": room },
        { $set: { "rooms.$.occupied": true } },
        { new: true }
      )
      .then((cinema) => {
        if (!cinema) {
          return Promise.reject("Cinema não encontrado");
        }
        return cinema;
      })
      .catch((err) => {
        return Promise.reject("Erro ao ocupar sala do cinema");
      });
  }

  return service;
}

module.exports = cinemaService;
