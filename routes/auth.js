const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email i hasło są wymagane." });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: "Użytkownik już istnieje." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
      },
    });

    res
      .status(201)
      .json({ message: "Użytkownik zarejestrowany.", userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email i hasło są wymagane." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Nieprawidłowe dane logowania." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Nieprawidłowe dane logowania." });
    }

    if (user.is2FAEnabled) {
      return res.status(200).json({
        message: "2FA required",
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
      message: "Zalogowano pomyślnie.",
      requires2FA: false,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera." });
  }
});

module.exports = router;
