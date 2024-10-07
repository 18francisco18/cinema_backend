const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");

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

      // Tenta salvar o novo usuário no banco de dados
      const result = await save(newUser);
      return result;
    } catch (err) {
      console.error("Error in create function:", err); // Adicionando um log mais detalhado
      return Promise.reject("Not Saved");
    }
  }

  async function save(model) {
  try {
    // Tenta salvar o modelo no banco de dados
    await model.save();
    return "User created";
  } catch (err) {
    console.error("Error saving user:", err);  // Adicionando um log mais detalhado
    return Promise.reject(`There is a problem with register: ${err.message}`);
  }
}


  // Converte para async
  async function findById(id) {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return Promise.reject("User not found");
      }
      return user;
    } catch (err) {
      return Promise.reject("Error fetching user");
    }
  }

  // Converte para async
  async function findAll() {
    try {
      const users = await UserModel.find({});
      return users;
    } catch (err) {
      return Promise.reject("Error fetching users");
    }
  }

  // Converte para async
  async function findUser(model, body) {
    try {
      const user = await model.findOne({ email: body.email });
      if (!user) {
        throw new Error("User not found");
      }

      const match = await bcrypt.compare(body.password, user.password);
      if (!match) {
        throw new Error("Invalid password");
      }

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
        return Promise.reject("User not found");
      }
      return "User successfully removed";
    } catch (err) {
      return Promise.reject("Error removing user");
    }
  }

  // Converte para async
  async function updateUser(id, updateData) {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!user) {
        return Promise.reject("User not found");
      }
      return user;
    } catch (err) {
      return Promise.reject("Error updating user");
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
