const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

function UserService(userModel) {
  let service = {
    create,
    findAll,
    findById,
    findUser,
    removeById,
    update,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyToken,
    createToken,
    deleteUser,
  };

    async function create(user) {
        let newUser = new userModel(user);
        return newUser.save();
    }

}


module.exports = UserService;
