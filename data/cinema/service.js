function cinemaService(cinemaModel) {
  let service = {
    create,
    findAll,
  };

  async function create(cinema) {
    try {
      let newCinema = new cinemaModel(cinema);
      return await newCinema.save();
    } catch (error) {
        console.log(error);
        throw new Error(`Erro ao criar cinema: ${error.message}`);
    }
  }


  async function findAll () {
    try {
        return await cinemaModel.find({});
    }
    catch (error) {
        console.log(error);
        throw new Error(`Erro ao buscar cinemas: ${error.message}`);
  }
}

  return service;
}

module.exports = cinemaService;
