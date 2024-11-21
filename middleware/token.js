const Users = require("../data/users");
const User = require("../data/users/user");

function verifyTokenMiddleware(req, res, next) {
  console.log('Cookies recebidos:', req.cookies);
  
  // Pega o token dos cookies
  const token = req.cookies.token;
  
  console.log('Token encontrado:', token);

  // Verifica se o token existe
  if (!token) {
    console.log('Nenhum token encontrado nos cookies');
    return res.status(401).send({ 
      auth: false, 
      message: "No token provided.",
      cookies: req.cookies,
      headers: req.headers
    });
  }

  Users.verifyToken(token)
    .then((decoded) => {
      console.log('Token decodificado:', decoded);
      req.roleUser = decoded.role;
      req.userId = decoded.id;
      next();
    })
    .catch((err) => {
      console.error("Token verification failed:", err);
      console.error("Token que falhou:", token);
      if (!res.headersSent) {
        return res.status(401).send({ 
          auth: false, 
          message: "Not authorized",
          error: err.message,
          token: token
        });
      }
    });
}

module.exports = verifyTokenMiddleware;
