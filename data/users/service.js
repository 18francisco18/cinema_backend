const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

function UserService(userModel) {
  let service = {
    create,
  };

  async function create(user) {
    let newUser = new userModel(user);
    return newUser.save();
  }
}

module.exports = UserService;
