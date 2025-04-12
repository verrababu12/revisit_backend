const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./models/userModel");
const Product = require("./models/productModel");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true, 
  })
);

dotenv.config();

app.listen(3001, () => {
  console.log(`Server Running at http://localhost:3001`);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MONGODB Connected"))
  .catch((error) => console.log("error", error));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token) {
    try {
      const decoded = jwt.verify(
        token.split(" ")[1],
        process.env.JWT_SECRET_TOKEN
      );
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized" });
    }
  } else {
    res.status(401).json({ message: "No token, not authorized" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    //  Validate password BEFORE hashing
    const tempUser = new User({ name, email, password });
    const validationError = tempUser.validateSync();
    if (validationError) {
      const errors = Object.values(validationError.errors).map(
        (err) => err.message
      );
      return res.status(400).json({ errors });
    }

    // ✅ Now hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user and save
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name },
      process.env.JWT_SECRET_TOKEN,
      {
        expiresIn: "30d",
      }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

const addProducts = async (req, res) => {
  try {
    const products = await Product.insertMany(req.body);
    res.status(201).json({ message: "Products added successfully", products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding products", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
};

const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

app.post("/api/auth/signup", registerUser);
app.post("/api/auth/login", loginUser);
app.get("/api/users", protect, getUsers);

app.post("/api/categories", protect, addProducts);
app.put("/api/categories/:id", protect, updateProduct);
app.get("/api/categories/products", protect, getProducts);
