require("dotenv").config();
const jwt = require("jsonwebtoken");

// Fail fast at boot if either secret is missing — never silently fall back to a known value.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_SECRET_FOR_VERIFY = process.env.JWT_SECRET_FOR_VERIFY;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET is missing or too short. Set a strong secret (>=32 chars) in .env. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

if (!JWT_SECRET_FOR_VERIFY || JWT_SECRET_FOR_VERIFY.length < 32) {
  throw new Error(
    'JWT_SECRET_FOR_VERIFY is missing or too short. Set a strong secret (>=32 chars) in .env.'
  );
}

const signInToken = (user, remember = false) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.fullname,
      role: user.role || 'user'
    },
    JWT_SECRET,
    {
      expiresIn: remember ? '30d' : '7d'
    }
  );
};

const tokenForVerify = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.fullname
    },
    JWT_SECRET_FOR_VERIFY,
    {
      expiresIn: '15m'
    }
  );
};

const isAuth = async (req, res, next) => {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      return res.status(401).send({
        message: "Token not provided"
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({
      message: "Token is not valid"
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
