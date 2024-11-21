const Users = require("../data/users");
const User = require("../data/users/user");

function verifyTokenMiddleware(req, res, next) {
  // Pega o token dos cookies
  const token = req.cookies.token;

  // Verifica se o token existe
  if (!token) {
    return res.status(401).send({ auth: false, message: "No token provided." });
  }

  Users.verifyToken(token)
    .then((decoded) => {
      req.roleUser = decoded.role;
      req.userId = decoded.id;
      next();
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      if (!res.headersSent) {
        return res.status(401).send({ auth: false, message: "Not authorized" });
      }
    });
}

module.exports = verifyTokenMiddleware;
