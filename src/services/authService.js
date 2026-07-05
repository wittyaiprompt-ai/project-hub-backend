const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
};

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user._id);
  user.password = undefined;

  return { user, token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password updated' };
};

const verifyProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isMember = project.members.some(
    (m) => m.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  return project;
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  verifyProjectAccess,
  generateToken,
};
