const Movie = require('./movies');
const MoviesService = require('./service');

const movieService = MoviesService(Movie);
module.exports = movieService;