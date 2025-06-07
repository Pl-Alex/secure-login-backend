const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = (req.headers.authorization || "").replace(/Bearer\s?/, "");
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({
        message: "No Access",
      });
    }
  } else {
    return res.status(403).json({
      message: "No Access",
    });
  }
}

module.exports = authenticateToken;
