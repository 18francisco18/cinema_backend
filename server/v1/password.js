const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../../data/users/user");
const secret = "supersecret";
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

function RecoverPassword() {
  const router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Endpoint para envio do email de recuperação de senha
  router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User with the given email does not exist");
    }

    // Gerar o token JWT
    const token = jwt.sign({ email: user.email }, secret, { expiresIn: "1h" });

    // Configurar o serviço de email
    let transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "c2139a2676ae88",
        pass: "0483249347945f",
      },
    });

    let mailOptions = {
      from: "support.cinemaclub@gmail.com",
      to: user.email,
      subject: "Password recovery",
      text: `You requested for a password recovery, here you have your token to change the password: ${token}`,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error("Error sending email", err);
        return res.status(500).send("Error sending email");
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(200).send("Password recovery email sent successfully");
  });

  // Endpoint para validar o token e permitir o reset da senha
  router.get("/reset/:token", async (req, res) => {
    const { token } = req.params;

    jwt.verify(token, secret, async function (err, decoded) {
      if (err) {
        return res.status(400).json({ message: "Invalid token" });
      }

      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(400).json({ message: "User with the given email does not exist" });
      }

      // Token válido, enviar resposta JSON
      return res.status(200).json({ message: "Token valid", email: decoded.email });
    });
  });

  // Endpoint para redefinir a senha
  router.post("/reset/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    jwt.verify(token, secret, async function (err, decoded) {
      if (err) {
        return res.status(400).json({ message: "Invalid token" });
      }

      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(400).json({ message: "User with the given email does not exist" });
      }

      // Criptografar a nova senha
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        if (err) {
          return res.status(500).json({ message: "Error hashing password" });
        }

        user.password = hash;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
      });
    });
  });

  return router;
}

module.exports = RecoverPassword;
