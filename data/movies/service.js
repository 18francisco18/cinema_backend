const axios = require("axios");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");

function MovieService() {
    let service = {
        getMovies,
        getMovieById,
        getMovieByTitle,
    };
    
    async function getMovies() {
        const response = await axios.get(
        `${MOVIE_API_BASE_URL}/movie/now_playing?api_key=${MOVIE_API_KEY}&language=en-US&page=1`
        );
        return response.data;
    }
    
    async function getMovieById(movieId) {
        const response = await axios.get(
        `${MOVIE_API_BASE_URL}/movie/${movieId}?api_key=${MOVIE_API_KEY}&language=en-US`
        );
        return response.data;
    }
    
    async function getMovieByTitle(title) {
        const response = await axios.get(
        `${MOVIE_API_BASE_URL}/search/movie?api_key=${MOVIE_API_KEY}&query=${title}`
        );
        return response.data;
    }
    
    return service;
    }