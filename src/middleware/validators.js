const { body, param } = require('express-validator');
const { STATUSES, PRIORITIES } = require('../models/Task');

const NAME_PATTERN = /^[a-zA-Z\s'-]+$/;

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2–100 characters')
    .matches(NAME_PATTERN)
    .withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const projectRules = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 2000 }),
];

const memberRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
];

const taskRules = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority'),
  body('assignee').optional({ nullable: true }).isMongoId().withMessage('Invalid assignee ID'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
  body('order').optional().isInt({ min: 0 }),
];

const statusRules = [
  body('status').isIn(STATUSES).withMessage('Invalid status'),
  body('order').optional().isInt({ min: 0 }),
];

const mongoId = (field) => param(field).isMongoId().withMessage('Invalid ID');

module.exports = {
  registerRules,
  loginRules,
  passwordRules,
  projectRules,
  memberRules,
  taskRules,
  statusRules,
  mongoId,
};
