const { AuthorizationError } = require("../AppError");
const scopes = require("../data/users/scopes");

function verifyAdmin(req, res, next) {
  try {
    console.log('Verificando admin. Role do usuário:', req.roleUser);
    
    // Verifica se o usuário tem role e se tem o scope admin
    if (!req.roleUser || !req.roleUser.scope.includes(scopes.Admin)) {
      throw new AuthorizationError("Acesso negado. Apenas administradores podem acessar esta rota.");
    }
    next();
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
}

module.exports = verifyAdmin;
