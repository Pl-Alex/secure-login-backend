const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");
const {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} = require("../validation/authValidation");

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          error: "User already exists",
          message:
            "An account with this email address already exists. Please use a different email or try logging in.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password_hash: hashedPassword,
        },
      });

      res.status(201).json({
        message: "User registered successfully",
        userId: newUser.id,
        next_step: "You can now login with your credentials",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Something went wrong during registration. Please try again.",
      });
    }
  }
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message:
            "No account found with this email address. Please check your email or register a new account.",
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          error: "Invalid password",
          message: "The password you entered is incorrect. Please try again.",
        });
      }

      if (user.is2FAEnabled) {
        return res.status(200).json({
          message: "2FA verification required",
          requires2FA: true,
          userId: user.id,
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "Login successful",
        requires2FA: false,
        token,
        user: {
          id: user.id,
          email: user.email,
          is2FAEnabled: user.is2FAEnabled,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Server error",
        message: "Something went wrong during login. Please try again.",
      });
    }
  }
);

module.exports = router;
