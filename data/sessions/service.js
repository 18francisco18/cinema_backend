const axios = require("axios");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");
const { Movie } = require("../movies");

const getMovies = async () => {
    const response = await axios.get(`${MOVIE_API_BASE_URL}`, {
        params: {
        apikey: MOVIE_API_KEY,
        },
    });
    
    if (response.data.Response === "False") {
        throw new Error(response.data.Error);
    }
    
    const movies = response.data.Search.map((movie) => ({
        title: movie.Title,
        year: movie.Year,
        imdbID: movie.imdbID,
        type: movie.Type,
        poster: movie.Poster,
    }));
    
    return movies;
};

const getMovieById = async (id) => {
    const response = await axios.get(`${MOVIE_API_BASE_URL}`, {
        params: {
        i: id,
        apikey: MOVIE_API_KEY,
        },
    });

    if (response.data.Response === "False") {
        throw new Error(response.data.Error);
    }

    const movieData = response.data;

    const transformedRatings = (movieData.Ratings || []).map((rating) => ({
        source: rating.Source || "N/A",
        value: rating.Value || "N/A",
    }));

    const completeMovieData = {
        title: movieData.Title || "N/A",
        year: movieData.Year || "N/A",
        rated: movieData.Rated || "N/A",
        released: movieData.Released || "N/A",
        runtime: movieData.Runtime || "N/A",
        genre: movieData.Genre || "N/A",
        director: movieData.Director || "N/A",
        writer: movieData.Writer || "N/A",
        actors: movieData.Actors || "N/A",
        plot: movieData.Plot || "N/A",
    }

    return completeMovieData;
}

module.exports = {
    getMovies,
    getMovieById,
};
