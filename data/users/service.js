const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../../config");
const { response } = require("express");

function UserService(UserModel) {
  let service = {
    create,
    findAll,
    findById,
    findUser,
    removeById,
    updateUser,
    createPassword,
    comparePassword,
    verifyToken,
    createToken,
  };

  function create(user) {
    return createPassword(user).then((hashPassword, err) => {
      if (err) {
        return Promise.reject("Not Saved");
      }
      let newUserWithPassword = {
        ...user,
        password: hashPassword,
      };
      let newUser = new UserModel(newUserWithPassword);
      return save(newUser);
    });
  }

  function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve("User created"))
        .catch((err) => reject(`There is a problem with register ${err}`));
    });
  }

  function findById(id) {
    return UserModel
      .findById(id)
      .then((user) => {
        if (!user) {
          return Promise.reject("User not found");
        }
        return user;
      })
      .catch((err) => {
        return Promise.reject("Error fetching user");
      });
  }

  function findAll() {
    return UserModel
      .find({})
      .then((users) => {
        return users;
      })
      .catch((err) => {
        return Promise.reject("Error fetching users");
      });
  }

  function findUser(model, body) {
    return model.findOne({ email: body.email }).then(function (user) {
      if (!user) {
        throw new Error("User not found");
      }

      return bcrypt
        .compare(body.password, user.password)
        .then(function (match) {
          if (!match) {
            throw new Error("Invalid password");
          }

          return user;
        });
    });
  }

  function removeById(id) {
    return UserModel
      .findByIdAndDelete(id)
      .then((user) => {
        if (!user) {
          return Promise.reject("User not found");
        }
        return "User successfully removed";
      })
      .catch((err) => {
        return Promise.reject("Error removing user");
      });
  }

  function updateUser(id, updateData) {
    return UserModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .then((user) => {
        if (!user) {
          return Promise.reject("User not found");
        }
        return user;
      })
      .catch((err) => {
        return Promise.reject("Error updating user");
      });
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

  function verifyToken(token) {
    return new Promise(function (resolve, reject) {
      jwt.verify(token, config.secret, function (err, decoded) {
        if (err) {
          reject();
        }
        return resolve(decoded);
      });
    });
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
