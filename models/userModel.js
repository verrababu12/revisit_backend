const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
        },
        message: "Invalid email format",
      },
      minlength: [8, "Email must be at least 8 characters long"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      validate: [
        {
          validator: function (password) {
            return /[A-Z]/.test(password);
          },
          message: "Password must contain at least one uppercase letter",
        },
        {
          validator: function (password) {
            return /[a-z]/.test(password);
          },
          message: "Password must contain at least one lowercase letter",
        },
        {
          validator: function (password) {
            return /\d/.test(password);
          },
          message: "Password must contain at least one number",
        },
        {
          validator: function (password) {
            return /[@$!%*?&]/.test(password);
          },
          message:
            "Password must contain at least one special character (@$!%*?&)",
        },
      ],
    },
  },
  { validateBeforeSave: true }
);

// Create User model
const user = mongoose.model("users", userSchema);
module.exports = user;
