let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let scopes = require('./scopes');

let RoleSchema = new Schema({
  name: { type: String, required: true },
  scope: [
    {
      type: String,
      enum: [scopes.Admin, scopes.User, scopes.Anonimous],
      default: scopes.Anonimous,
    },
  ],
});

let userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: RoleSchema },
});

let User = mongoose.model("User", userSchema);
module.exports = User;