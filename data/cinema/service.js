

function cinemaService(cinemaModel) {
    let service = {
        create,
        save,
        findAll
    };

    function create(cinema) {
        let newCinema = new cinemaModel(cinema)
        return newCinema.save()
    }

    function save(newCinema) {
        return new Promise((resolve, reject) => {
            newCinema
            .save((err, savedCinema) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(savedCinema)
                }
            })
        })
    }

    function findAll() {
        return new Promise((resolve, reject) => {
            cinemaModel
            .find({}, (err, cinemas) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(cinemas)
                }
            })
        })
    }

    return service;
}

module.exports = cinemaService;