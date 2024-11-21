const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Users = require("../../data/users");
const User = require("../../data/users/user");
const VerifyToken = require("../../middleware/token");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const UserService = require("../../data/users/service");

const AuthRouter = () => {
  let router = express();
  const userService = UserService(User);

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router
    .route("/register")
    .post(function (req, res, next) {
      const body = req.body;
      console.log("User:", body);
      body.role = { name: 'User', scope: ['user'] };

      Users.create(body)
        .then(() => Users.createToken(body))
        .then((response) => {
          console.log("User token:", response);
          res.cookie("token", response.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
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
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
          console.log('Cookie definido:', {
            token: login.token,
            options: {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 24 * 60 * 60 * 1000
            }
          });
          res.status(200).send({
            token: login.token,
            userId: login.userId,
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send(err);
          next();
        });
    });

  router
    .route("/logout")
    .post(function (req, res) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      res.status(200).send({ message: "Logged out successfully" });
    });

  router
    .route("/me")
    .get(VerifyToken, function (req, res) {
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

  router
    .route("/user/:id")
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

  router.post("/generate-qr", async (req, res) => {
    try {
      const { email, password } = req.body;
      const qrCode = await userService.generateLoginQRCode(email, password);
      res.json({ qrCode });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  router.post("/login-qr", async (req, res) => {
    try {
      const { qrData } = req.body;
      const user = await userService.verifyQRCodeData(qrData);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = await userService.createToken(user);
      res.json({ token, user });
    } catch (error) {
      console.error("Error logging in with QR code:", error);
      res.status(500).json({ error: "Failed to login with QR code" });
    }
  });

  router.use(VerifyToken);

  return router;
};

module.exports = AuthRouter;
