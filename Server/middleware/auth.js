const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/auth");

function requireJwt(options = {}) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : "";

      if (!token) {
        if (options.optional) return next();
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      const payload = jwt.verify(token, JWT_SECRET);

      if (
        options.adminOnly &&
        payload.userType !== "admin" &&
        payload.type !== "admin" &&
        payload.type !== "superadmin"
      ) {
        return res.status(403).json({ success: false, message: "Admin only" });
      }

      req.user = payload;
      next();
    } catch (err) {
      if (options.optional) return next();
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  };
}

module.exports = {
  requireJwt,
};
