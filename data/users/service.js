const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");

function UserService(UserModel) {
  let service = {
    create, //feito
    findAll, //feito
    findById, //feito
    findUser, //feito
    removeById, //feito
    updateUser, //feito
    createPassword, //feito
    comparePassword, //feito
    verifyToken, //feito
    createToken, //feito
  };

  async function create(user) {
    try {
      // Cria a senha criptografada
      const hashPassword = await createPassword(user);

      // Monta o novo objeto do usuário com a senha criptografada
      let newUserWithPassword = {
        ...user,
        password: hashPassword,
      };

      // Cria uma nova instância do modelo de usuário
      let newUser = new UserModel(newUserWithPassword);
      if (!newUser) throw new DatabaseError("Error creating user");
      

      // Tenta salvar o novo usuário no banco de dados
      const result = await save(newUser);
      return result;
    } catch (err) {
      console.error("Error in create function:", err); // Adicionando um log mais detalhado
      throw err;
    }
  }

  async function save(model) {
  try {
    // Tenta salvar o modelo no banco de dados
    await model.save();
    return "User created";
  } catch (err) {
    console.error("Error saving user:", err);  // Adicionando um log mais detalhado
    throw new DatabaseError("Error saving user");
  }
}


  // Converte para async
  async function findById(id) {
    try {
      const user = await UserModel.findById(id);
      if (!user) throw new NotFoundError("User not found");
      return user;
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function findAll() {
    try {
      const users = await UserModel.find({});
      if (!users) throw new DatabaseError("Users not found");
      if (users.length === 0) throw new NotFoundError("No users found");
      return users;
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function findUser(model, body) {
    try {
      const user = await model.findOne({ email: body.email });
      if (!user) throw new NotFoundError("User not found");

      const match = await bcrypt.compare(body.password, user.password);
      if (!match) throw new NotFoundError("Invalid password");
      return user;
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function removeById(id) {
    try {
      const user = await UserModel.findByIdAndDelete(id);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      return "User successfully removed";
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function updateUser(id, updateData) {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!user) throw new NotFoundError("User not found");
      return user;
    } catch (err) {
      throw err;
    }
  }

  // Converte para async
  async function verifyToken(token) {
    try {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, config.secret, (err, decoded) => {
          if (err) reject(err);
          resolve(decoded);
        });
      });
      return decoded;
    } catch (err) {
      throw err;
    }
  }

  function createToken(user) {
    let token = jwt.sign(
      { id: user._id, name: user.name, role: user.role.scopes },
      config.secret,
      {
        expiresIn: config.expiresPassword,
      }
    );
    return { auth: true, token };
  }

  function createPassword(user) {
    return bcrypt.hash(user.password, config.saltRounds);
  }

  function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  return service;
}

module.exports = UserService;
