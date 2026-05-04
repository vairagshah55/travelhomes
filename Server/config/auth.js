const jwt = require("jsonwebtoken");
const env = require("./env");

const { JWT_SECRET, JWT_SECRET_FOR_VERIFY } = env;

const signInToken = (user, remember = false) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.fullname,
      role: user.role || "user",
    },
    JWT_SECRET,
    {
      expiresIn: remember ? "30d" : "7d",
    },
  );
};

const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.fullname,
    },
    JWT_SECRET_FOR_VERIFY,
    {
      expiresIn: "15m",
    },
  );
};

const isAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      return res.status(401).send({
        message: "Token not provided",
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({
      message: "Token is not valid",
    });
  }
};

module.exports = {
  signInToken,
  tokenForVerify,
  isAuth,
  JWT_SECRET,
  JWT_SECRET_FOR_VERIFY,
};
