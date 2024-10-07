const Users = require("../data/users");
const User = require("../data/users/user");

module.exports = (req, res, next) => {
  const token = req.cookies.token || req.headers["authorization"];

  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).send({ auth: false, message: "No token provided." });
  }

  // Se o token vier dos headers, remove a palavra 'Bearer ' antes de verificar
  const bearerToken = token.startsWith("Bearer ")
    ? token.slice(7, token.length)
    : token;

  Users.verifyToken(bearerToken)
    .then((decoded) => {
      req.roleUser = decoded.role;
      next(); // Chama o próximo middleware apenas se o token for válido
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      if (!res.headersSent) {
        // Apenas envia a resposta se nenhuma outra resposta tiver sido enviada
        return res.status(401).send({ auth: false, message: "Not authorized" });
      }
    });
};
