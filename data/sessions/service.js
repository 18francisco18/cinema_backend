const axios = require("axios");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");
//Variável da rooms
const RoomModel = require("../rooms");
const Room = require("../rooms/rooms");

function sessionService(sessionModel) {
  let service = {
    create,
    findAll,
    getMovieByTitleYearAndPlot,
    checkAvailability,
    bookSession,
    confirmPayment,
    cancelPayment,
    showSeatsAvailable,
    occupySeat,
    confirmSeat,
    releaseSeat,
  };

  function create(session) {
    let newSession = new sessionModel(session);
    return newSession.save();
  }

  function findAll() {
    return sessionModel.find({}).populate("movie").populate("room").populate("cinema").populate("tickets");
  }

  async function getMovieByTitleYearAndPlot(title, year, plot) {
        console.log("chamei a funçao getMovieByTitleYearAndPlot");

        try {
        const response = await axios.get(`${MOVIE_API_BASE_URL}`, {
                params: {
                t: title,
                y: year,
                plot: plot,
                apikey: MOVIE_API_KEY,
                },
            });
            if (response.data.Response === "False") {
            console.log("erro");
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

                // Transforma o array de avaliações (Ratings) em um array de objetos com os campos source e value

                ratings: transformedRatings,
                poster: movieData.Poster || "N/A",
                metascore: movieData.Metascore || "N/A",
                imdbRating: movieData.imdbRating || "N/A",
                imdbVotes: movieData.imdbVotes || "N/A",
                imdbID: movieData.imdbID || "N/A",
                type: movieData.Type || "N/A",
                dvd: movieData.DVD || "N/A",
                boxOffice: movieData.BoxOffice || "N/A",
                production: movieData.Production || "N/A",
                website: movieData.Website || "N/A",
                response: movieData.Response || "N/A",
            };
            return completeMovieData;
        } 
    
        catch (error) {
            console.log(error);
            throw new Error(`Error getting movie: ${error.message}`);
        }
    }

    async function checkAvailability(sessionId) {
        try {
            let session = await sessionModel.findById(sessionId);
            let room = await RoomModel.findById(session.room);
            let tickets = await sessionModel.findById(sessionId).populate("tickets");

            let availableSeats = room.seats - tickets.length;
            return availableSeats;
        } catch (error) {
            console.log(error);
            throw new Error(`Error checking availability: ${error.message}`);
        }
    }

    async function bookSession(sessionId, tickets) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { $push: { tickets: tickets } },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error booking session: ${error.message}`);
        }
    }

    async function confirmPayment(sessionId) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { paymentConfirmed: true },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error confirming payment: ${error.message}`);
        }
    }

    async function cancelPayment(sessionId) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { paymentConfirmed: false },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error cancelling payment: ${error.message}`);
        }
    }

    async function showSeatsAvailable(sessionId) {
        try {
            let session = await sessionModel.findById(sessionId);
            let room = await RoomModel.findById(session.room);
            let tickets = await sessionModel.findById(sessionId).populate("tickets");

            let availableSeats = room.seats - tickets.length;
            return availableSeats;
        } catch (error) {
            console.log(error);
            throw new Error(`Error showing available seats: ${error.message}`);
        }
    }

    async function occupySeat(sessionId, seat) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { $push: { occupiedSeats: seat } },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error occupying seat: ${error.message}`);
        }
    }

    async function confirmSeat(sessionId, seat) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { $push: { confirmedSeats: seat } },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error confirming seat: ${error.message}`);
        }
    }

    async function releaseSeat(sessionId, seat) {
        try {
            let session = await sessionModel.findById(sessionId);
            let updatedSession = session;
            updatedSession = await sessionModel.findByIdAndUpdate(
                sessionId,
                { $pull: { confirmedSeats: seat } },
                { new: true }
            );
            return updatedSession;
        } catch (error) {
            console.log(error);
            throw new Error(`Error releasing seat: ${error.message}`);
        }
    }

    return service;
}

module.exports = sessionService;
