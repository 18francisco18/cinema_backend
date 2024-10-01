const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const express = require("express");
const Users = require("../data/users");
const User = require("../data/users/user");
const VerifyToken = require("../middleware/token");

const AuthRouter = () => {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router
    .route("/register")
    // Create a user
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

  router.route("/login").post(function (req, res, next) {
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

  router.route("/me").get(VerifyToken, function (req, res, next) {
    const token = req.cookies.token || req.headers["authorization"];
    jwt.verify(token, config.secret, function (err, decoded) {
      if (err) {
        return res
          .status(500)
          .send({ auth: false, message: "Failed to authenticate token." });
      }
      res.status(200).send(decoded);
    });
  });

  router.route("/user/:id").get(VerifyToken, function (req, res, next) {
    const userId = req.params.id;
    findById(userId)
      .then((user) => {
        res.status(200).send(user);
      })
      .catch((err) => {
        res.status(404).send({ error: err });
      });
  });

  router.use(cookieParser());
  router.use(VerifyToken);

  return router;
};

module.exports = AuthRouter;
