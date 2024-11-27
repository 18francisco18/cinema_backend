const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const Users = require("../../data/users");
const User = require("../../data/users/user");
const VerifyToken = require("../../middleware/token");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const UserService = require("../../data/users/service");
const scopes = require("../../data/users/scopes");

const AuthRouter = () => {
  let router = express();
  const userService = UserService(User);

  router.use(cookieParser());
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router
    .route("/register")
    .post(async function (req, res, next) {
      try {
        const body = req.body;
        console.log("Received registration request:", body);
        
        // Se não houver role definida, define como user normal
        if (!body.role) {
          body.role = { 
            name: 'User', 
            scope: [scopes.User] 
          };
        } else {
          // Validar se o scope é válido
          const validScopes = [scopes.Admin, scopes.User, scopes.Anonimous];
          const requestedScope = body.role.scope;
          
          // Garantir que scope é um array
          const scopeArray = Array.isArray(requestedScope) ? requestedScope : [requestedScope];
          
          // Verificar se todos os scopes são válidos
          const isValidScope = scopeArray.every(scope => validScopes.includes(scope));
          if (!isValidScope) {
            return res.status(400).send({ error: "Invalid role scope" });
          }
          
          // Atualizar o body com o scope formatado corretamente
          body.role.scope = scopeArray;
        }

        console.log("Creating user with formatted data:", body);

        // Criar o usuário
        const createResult = await Users.create(body);
        console.log("User creation result:", createResult);

        // Criar o token
        const tokenResult = await Users.createToken(body);
        console.log("Token creation result:", tokenResult);

        res.cookie("token", tokenResult.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.status(200).send(tokenResult);
      } catch (err) {
        console.error("Registration error:", err);
        if (err.name === "ValidationError") {
          return res.status(400).send(err);
        }
        res.status(500).send(err);
      }
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
    .get(VerifyToken, async function (req, res) {
      try {
        const token = req.cookies.token || req.headers["authorization"];
        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(token, config.secret, function (err, decoded) {
            if (err) reject(err);
            resolve(decoded);
          });
        });

        // Fetch complete user data from database
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).send({ auth: false, message: "User not found." });
        }

        // Return user data without sensitive information
        const userData = {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          points: user.points || 0
        };

        res.status(200).send(userData);
      } catch (err) {
        return res
          .status(500)
          .send({ auth: false, message: "Failed to authenticate token." });
      }
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
    .put(VerifyToken, async function (req, res, next) {
      try {
        const userId = req.params.id;
        const { name, username } = req.body;

        // Verify if the authenticated user is updating their own profile
        if (userId !== req.userId) {
          return res.status(403).send({ error: "Not authorized to update this user's profile" });
        }

        // Check for duplicate username if username is being updated
        if (username) {
          const existingUser = await User.findOne({ username, _id: { $ne: userId } });
          if (existingUser) {
            return res.status(400).send({ error: "Username already exists" });
          }
        }

        // Only allow updating name and username
        const updateData = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username;

        const updatedUser = await Users.updateUser(userId, updateData);
        
        res.status(200).send({
          message: "User profile updated successfully",
          user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role
          }
        });
      } catch (err) {
        console.error(err);
        if (err.name === 'NotFoundError') {
          return res.status(404).send({ error: err.message });
        }
        res.status(500).send({ error: "An error occurred while updating the user" });
      }
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
