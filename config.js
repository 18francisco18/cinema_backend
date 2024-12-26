const config = {
  db: process.env.MONGODB_URI || "mongodb+srv://18francisco18:P7ZepoGK0IyWd346@cinema.wj03m.mongodb.net/?retryWrites=true&w=majority&appName=Cinema",
  secret: process.env.SECRET_KEY || "supersecret",
  expiresPassword: 1718531517,
  saltRounds: 10,
};

//password: P7ZepoGK0IyWd346

module.exports = config;
