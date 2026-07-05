const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { AppError } = require('./errorHandler');

const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Not authorized', 401);
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Not authorized', 401));
    }
    next(err);
  }
};

module.exports = { protect };
