const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const jwt = require("jsonwebtoken");

mongoose
  .connect("mongodb+srv://Ayyappa:12345@cluster0.tohlkvl.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error Connecting to MongoDB");
  });

app.listen(port ,"10.0.2.2",() => {
  console.log("server is running on port 3000");
});

const User = require("./models/user");
const Post = require("./models/post");

// endpoint to registered a user in the backend

app.post("./register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findone({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email Already Registered" });
    }

    // create a new user
    const newUser = new User({ name, email, password });

    //generate and store the verification code
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    // save the user to the Database

    await newUser.save();

    // send the Verification email to the user

    sendVerificationEmail(newUser.email, newUser.verificationToken);

    res.status(200).json({ message: "registration successfull" });
  } catch (error) {
    console.log("error registering user", error);
    res.status(500).json({ message: "error registering user" });
  }
});

// const sendVerificationEmail = async (email, verificationToken) => {
//   //create a node mailer transporter

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "piab902@gmail.com",
//       pass: "rwbitpiwymnoazdg",
//     },
//   });

//   //compose the email message

//   const mailOptions = {
//     from: "threads.com",
//     to: email,
//     subject: "Email Verification",
//     text: `please check the following link to verify your email http://192.168.1.6:3000/verify/${verificationToken}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.log("error sending email", error);
//   }
// };

// if user click the verification code in the email for verification purpose

// app.get("/verify/:token", async (req, res) => {
//   try {
//     const token = req.params.token;

//     const user = await User.findone({ verificationToken: token });

//     if (!user) {
//       return res.status(500).json({ message: "email verification failed" });
//     }

//     user.verified = true;
//     user.verificationToken = undefined;
//     await user.save();

//     res.status(200).json({ message: "Email Verified Successfully" });
//   } catch (error) {
//     console.log("error getting token", error);
//     res.status(500).json({ message: "Email Verification failed" });
//   }
// });

// Endpoint to login in user to the backend

app.post("./login",async(req,res) =>{
  try {
    const token = req.params.token;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid token" });
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.log("error getting token", error);
    res.status(500).json({ message: "Email verification failed" });
  }
});

const generateSecretKey = () => {
  const secretKey = crypto.randomBytes(32).toString("hex");
  return secretKey;
};

const secretKey = generateSecretKey();

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email" });
    }

    if (user.password !== password) {
      return res.status(404).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ userId: user._id }, secretKey);

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});
