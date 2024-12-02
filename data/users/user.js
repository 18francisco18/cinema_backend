let mongoose = require("mongoose");
let Schema = mongoose.Schema;
let scopes = require("./scopes");

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
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  role: { type: RoleSchema },
  points: { type: Number, default: 0, required: false },
  redeemedMerchandise: [
    {
      type: Schema.Types.ObjectId,
      ref: "Merchandise",
    },
  ], 
  stripeCustomerId: { type: String, required: false },
});

let User = mongoose.model("User", userSchema);
module.exports = User;
