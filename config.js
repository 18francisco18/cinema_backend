require('dotenv').config();

const config = {
  db: process.env.MONGODB_URI || "mongodb+srv://18francisco18:P7ZepoGK0IyWd346@cinema.wj03m.mongodb.net/?retryWrites=true&w=majority&appName=Cinema",
  secret: process.env.SECRET_KEY || "supersecret",
  expiresPassword: 1718531517,
  saltRounds: 10,
  MOVIE_API_BASE_URL: process.env.MOVIE_API_BASE_URL || "http://www.omdbapi.com/",
  MOVIE_API_KEY: process.env.MOVIE_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  EMAIL_ADDRESS: process.env.EMAIL_ADDRESS || "default@email.com",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "defaultpassword",
  API_VERSION: process.env.API_VERSION || "v1",
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || "default_key",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@cinema.com",
};

//password: P7ZepoGK0IyWd346

module.exports = config;
