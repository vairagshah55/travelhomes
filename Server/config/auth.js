require("dotenv").config();
const jwt = require("jsonwebtoken");

const signInToken = (user, remember = false) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.fullname,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET || 'defaultsecret',
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
    process.env.JWT_SECRET_FOR_VERIFY || 'defaultverifysecret',
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
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
};
