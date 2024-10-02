const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");
const User = require("../data/users/user");
const VerifyToken = require("../middleware/token");
const jwt = require("jsonwebtoken");
const config = require("../config");

const AuthRouter = () => {
  let router = express();

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router
    .route("/register")
    // Create a user (FUNCIONA)
    .post(function (req, res, next) {
      const body = req.body;
      console.log("User:", body);
      Users.create(body)
        .then(() => Users.createToken(body))
        .then((response) => {
          console.log("User token:", response);
          res.status(200).send(response);
        })
        .catch((err) => {
          console.log("Error:", err);
          res.status(500).send(err);
          next();
        });
    });

  router
    .route("/login")
    // (FUNCIONA)
    .post(function (req, res, next) {
      let body = req.body;
      console.log("Login for user:", body);
      return Users.findUser(User, body)
        .then((user) => {
          return Users.createToken(user);
        })
        .then((login) => {
          console.log("Login token:", login.token);
          res.cookie("token", login.token, {
            httpOnly: true,
            sameSite: "None",
            secure: true,
            domain: "localhost:3000",
          });
          res.status(200);
          res.send({
            token: login.token,
            userId: login.userId,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500);
          res.send(err);
          next();
        });
    });

  //  router.route("/me").get(VerifyToken, function (req, res, next) {
  //    const token = req.cookies.token || req.headers["authorization"];
  //    jwt.verify(token, config.secret, function (err, decoded) {
  //      if (err) {
  //        return res
  //          .status(500)
  //          .send({ auth: false, message: "Failed to authenticate token." });
  //      }
  //      res.status(200).send(decoded);
  //    });
  //  });

  router
    .route("/user/:id")
    // (FUNCIONA)
    .get(VerifyToken, function (req, res, next) {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
      }
      User.findById(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send(user);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send({ error: "An error occurred" });
        });
    })
    // DELETE user by ID
    .delete(VerifyToken, function (req, res, next) {
      const userId = req.params.id;
      if (!userId) {
        return res.status(400).send({ error: "User ID is required" });
      }
      User.findByIdAndDelete(userId)
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send({ message: "User successfully deleted" });
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .send({ error: "An error occurred while deleting the user" });
        });
    });

  router
    .route("/users")
    // GET - All users
    .get(VerifyToken, function (req, res, next) {
      User.find({})
        .then((users) => {
          if (!users || users.length === 0) {
            return res.status(404).send({ error: "No users found" });
          }
          res.status(200).send(users);
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .send({ error: "An error occurred while fetching users" });
        });
    });

  router
    .route("/user/email/:email")
    // GET - Buscar usuário por email
    .get(VerifyToken, function (req, res, next) {
      const userEmail = req.params.email;
      if (!userEmail) {
        return res.status(400).send({ error: "User email is required" });
      }

      User.findOne({ email: userEmail })
        .then((user) => {
          if (!user) {
            return res.status(404).send({ error: "User not found" });
          }
          res.status(200).send(user);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send({ error: "An error occurred" });
        });
    });

  router
  // PUT - Atualizar usuário por email
    .route("/user/update/:email")
    .put(VerifyToken, async function (req, res, next) {
      const userEmail = req.params.email;
      const { name, username } = req.body;
      if (!userEmail) {
        return res.status(400).send({ error: "User email is required" });
      }
      try {
        const updateData = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username;
        const user = await User.findOneAndUpdate(
          { email: userEmail },
          { $set: updateData },
          { new: true }
        );
        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }
        res.status(200).send(user);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "An error occurred" });
      }
    });

  router.use(VerifyToken);

  return router;
};

module.exports = AuthRouter;
