const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { taskRules, statusRules, mongoId } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.get('/projects/:projectId/tasks', mongoId('projectId'), validate, taskController.getTasks);
router.post('/projects/:projectId/tasks', mongoId('projectId'), taskRules, validate, taskController.createTask);
router.get('/:id', mongoId('id'), validate, taskController.getTask);
router.put('/:id', mongoId('id'), taskRules, validate, taskController.updateTask);
router.patch('/:id/status', mongoId('id'), statusRules, validate, taskController.updateStatus);
router.delete('/:id', mongoId('id'), validate, taskController.deleteTask);

module.exports = router;
