const express = require("express");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const prisma = require("../prisma/client");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../utils/authenticateToken");
const {
  twoFAValidation,
  handleValidationErrors,
} = require("../validation/authValidation");

const router = express.Router();

router.get("/setup", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (user.is2FAEnabled) {
      return res.status(400).json({
        error: "2FA already enabled",
        message:
          "Two-factor authentication is already enabled for your account.",
      });
    }

    const secret = speakeasy.generateSecret({
      name: `SecureLogin (${req.user.email})`,
    });

    const qrDataURL = await qrcode.toDataURL(secret.otpauth_url);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { twoFASecret: secret.base32 },
    });

    res.json({
      message: "2FA setup initiated",
      qr: qrDataURL,
      secret: secret.base32,
      next_step:
        "Scan the QR code with your authenticator app and verify with a code to complete setup",
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({
      error: "2FA setup failed",
      message: "Unable to generate 2FA setup. Please try again.",
    });
  }
});

router.post(
  "/verify",
  authenticateToken,
  twoFAValidation,
  handleValidationErrors,
  async (req, res) => {
    const { code } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user.twoFASecret) {
        return res.status(400).json({
          error: "2FA not set up",
          message: "Please set up 2FA first before verifying.",
        });
      }

      if (user.is2FAEnabled) {
        return res.status(400).json({
          error: "2FA already enabled",
          message:
            "Two-factor authentication is already enabled for your account.",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token: code,
        window: 1,
      });

      if (!verified) {
        return res.status(401).json({
          error: "Invalid 2FA code",
          message:
            "The 2FA code you entered is incorrect. Please check your authenticator app and try again.",
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { is2FAEnabled: true },
      });

      res.json({
        message: "2FA activated successfully",
        next_step:
          "Two-factor authentication is now required for all future logins",
      });
    } catch (err) {
      console.error("2FA verification error:", err);
      res.status(500).json({
        error: "2FA verification failed",
        message:
          "Something went wrong during 2FA verification. Please try again.",
      });
    }
  }
);

router.post(
  "/login",
  twoFAValidation,
  handleValidationErrors,
  async (req, res) => {
    const { userId, code } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing user ID",
        message: "User ID is required for 2FA login.",
      });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "Invalid user session. Please login again.",
        });
      }

      if (!user.is2FAEnabled || !user.twoFASecret) {
        return res.status(403).json({
          error: "2FA not enabled",
          message: "Two-factor authentication is not enabled for this account.",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: "base32",
        token: code,
        window: 1,
      });

      if (!verified) {
        return res.status(401).json({
          error: "Invalid 2FA code",
          message:
            "The 2FA code you entered is incorrect. Please check your authenticator app and try again.",
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Login successful with 2FA",
        token,
        user: {
          id: user.id,
          email: user.email,
          is2FAEnabled: user.is2FAEnabled,
        },
      });
    } catch (err) {
      console.error("2FA login error:", err);
      res.status(500).json({
        error: "2FA login failed",
        message: "Something went wrong during 2FA login. Please try again.",
      });
    }
  }
);

module.exports = router;
