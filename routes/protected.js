const express = require("express");
const authenticateToken = require("../utils/authenticateToken");
const router = express.Router();

router.get("/me", authenticateToken, (req, res) => {
  res.json({ message: "Dostęp przyznany", user: req.user });
});

module.exports = router;
