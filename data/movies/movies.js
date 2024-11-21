const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ratingSchema = new Schema({
  source: { type: String, required: true },
  value: { type: String, required: true },
});

const commentsSchema = new Schema({
  user : { type: Schema.Types.ObjectId, ref: 'User' },
  comment : { type: String, required: true },
  createdAt : { type: Date, default: Date.now },
});

const movieSchema = new Schema({
    title: { type: String, required: true },
    year: { type: String, required: true },
    rated: { type: String, required: true },
    released: { type: String, required: true },
    runtime: { type: String, required: true },
    genre: { type: String, required: true },
    director: { type: String, required: true },
    writer: { type: String, required: true },
    actors: { type: String, required: true },
    plot: { type: String, required: true },
    language: { type: String, required: true },
    country: { type: String, required: true },
    awards: { type: String, required: true },
    poster: { type: String, required: true },
    ratings: { type: [ratingSchema], required: true },
    metascore: { type: String, required: true },
    imdbRating: { type: String, required: true },
    imdbVotes: { type: String, required: true },
    imdbID: { type: String, required: true },
    type: { type: String, required: true },
    dvd: { type: String, required: true },
    boxOffice: { type: String, required: true },
    production: { type: String, required: true },
    website: { type: String, required: true },
    response: { type: String, required: true },
    comments: [commentsSchema],
});

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;