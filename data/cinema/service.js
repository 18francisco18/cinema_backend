function cinemaService(cinemaModel) {
  let service = {
    create,
    save,
    findAll,
    findById,
    findByIdAndUpdate,
    removeCinemaById,
    findRoomsById,
    fillRoom,
    removeRoom,
    occupyRoom,
  };

  // Cria um novo cinema
  async function create(cinema) {
    try {
      let newCinema = new cinemaModel(cinema);
      return await save(newCinema);
    } catch (error) {
      console.log(error);
      throw new Error(`Check for missing fields or wrong fields`);
    }
  }

  // Salva um modelo
  function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve(model))
        .catch((err) => reject(`Houve um problema ao criar o cinema ${err}`));
    });
  }

  // Encontra todos os cinemas
  async function findAll() {
    try {
      return await cinemaModel.find({});
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao buscar cinemas: ${error.message}`);
    }
  }

  // Encontra um cinema pelo id
  async function findById(id) {
    try {
      return await cinemaModel.findById(id);
    } catch (error) {
      console.log(error);
      throw new Error(`Cinema not found`);
    }
  }

  // Atualiza um cinema pelo id
  async function findByIdAndUpdate(id, cinema) {
    try {
      return await cinemaModel.findByIdAndUpdate(id, cinema, { new: true });
    } catch (error) {
      console.log(error);
      throw new Error(`Cinema not found`);
    }
  }

  


  // Encontra as salas de um cinema pelo id
  async function findRoomsById(id) {
    try {
      // Encontrar o cinema pelo id e popular as salas (populate serve para buscar toda a informação 
      //da sala através do seu id)
      const cinema = await cinemaModel.findById(id).populate("rooms");
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema.rooms;
    } catch (err) {

      if (err.message === "Cinema not found") {
        throw err;
      }

      throw new Error("Erro ao buscar salas do cinema");
    }
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

  // Remove uma sala de um cinema
  async function removeRoom(id, room) {
    try {
      const cinema = await cinemaModel.findByIdAndUpdate(
        id,
        { $pull: { rooms: room } },
        { new: true }
      );
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema;
    } catch (err) {
      if (err.message === "Cinema not found") {
        throw err;
      }
      throw new Error("Erro ao remover sala do cinema");
    }
  }

  // Remove um cinema pelo id, removendo tambeḿ todas as salas associadas a ele.
  async function removeCinemaById(id) {
    try {
      // Utilizado functionName para identificar a função que está a ser chamada, de forma
      // a poder identificar a função no .pre utilizado no modelo de cinema devido a necessidade
      // de futuramente utilizar mais findByIdAndDelete, evitando conflitos.
      const cinema = await cinemaModel.findByIdAndDelete(id, { functionName: "removeCinemaById" });
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema;
    } catch (err) {
      throw new Error("Erro ao remover cinema");
    }
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
