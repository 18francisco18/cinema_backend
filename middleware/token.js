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
      next();
    })
    .catch(() => {
      res.status(401).send({ auth: false, message: "Not authorized" });
    });
};
