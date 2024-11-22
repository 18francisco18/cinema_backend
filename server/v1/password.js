const express = require("express");
const User = require("../../data/users/user");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

function RecoverPassword() {
  const router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Armazenar códigos temporariamente
  const resetCodes = new Map();

  // Função para gerar código de 4 dígitos
  function generateResetCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Endpoint para envio do email de recuperação de senha
  router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User with the given email does not exist");
    }

    // Gerar código de 4 dígitos
    const resetCode = generateResetCode();
    
    // Armazenar o código com um tempo de expiração (1 hora)
    resetCodes.set(email, {
      code: resetCode,
      expiresAt: Date.now() + 3600000 // 1 hora
    });

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
      subject: "Password Recovery Code",
      text: `You requested for a password recovery. Here is your 4-digit code to reset your password: ${resetCode}\n\nThis code will expire in 1 hour.`,
    };

    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error("Error sending email", err);
        return res.status(500).send("Error sending email");
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    res.status(200).send("Password recovery code sent successfully");
  });

  // Endpoint para redefinir a senha com o código
  router.post("/reset-password", async (req, res) => {
    const { email, code, password } = req.body;

    // Verificar se existe um código para este email
    const resetData = resetCodes.get(email);
    if (!resetData) {
      return res.status(400).json({ message: "No reset code found for this email" });
    }

    // Verificar se o código expirou
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ message: "Reset code has expired" });
    }

    // Verificar se o código está correto
    if (resetData.code !== code) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Criptografar a nova senha
    bcrypt.hash(password, saltRounds, async function (err, hash) {
      if (err) {
        return res.status(500).json({ message: "Error hashing password" });
      }

      user.password = hash;
      await user.save();

      // Remover o código usado
      resetCodes.delete(email);

      res.status(200).json({ message: "Password reset successfully" });
    });
  });

  return router;
}

module.exports = RecoverPassword;
