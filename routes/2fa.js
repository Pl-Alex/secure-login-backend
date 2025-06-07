const express = require("express");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../utils/authenticateToken");

const router = express.Router();

router.get("/setup", authenticateToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `SecureLogin (${req.user.email})`,
    });

    const qrDataURL = await qrcode.toDataURL(secret.otpauth_url);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { twoFASecret: secret.base32 },
    });

    res.json({ qr: qrDataURL, secret: secret.base32 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nie udało się wygenerować 2FA." });
  }
});

router.post("/verify", authenticateToken, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Brak kodu 2FA." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ error: "Nieprawidłowy kod 2FA." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { is2FAEnabled: true },
    });

    res.json({ message: "2FA aktywowane." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd weryfikacji 2FA." });
  }
});

router.post("/login", async (req, res) => {
  const { userId, code } = req.body;

  if (!userId || !code) {
    return res.status(400).json({ error: "Brak userId lub kodu." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.is2FAEnabled || !user.twoFASecret) {
      return res
        .status(403)
        .json({ error: "2FA nieaktywne lub brak użytkownika." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ error: "Nieprawidłowy kod 2FA." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Zalogowano (2FA)", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd logowania 2FA." });
  }
});

module.exports = router;
