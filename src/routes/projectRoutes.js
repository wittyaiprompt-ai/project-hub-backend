const express = require('express');
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { projectRules, memberRules, mongoId } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.get('/', projectController.getProjects);
router.post('/', projectRules, validate, projectController.createProject);
router.get('/:id', mongoId('id'), validate, projectController.getProject);
router.put('/:id', mongoId('id'), projectRules, validate, projectController.updateProject);
router.delete('/:id', mongoId('id'), validate, projectController.deleteProject);
router.post('/:id/members', mongoId('id'), memberRules, validate, projectController.addMember);
router.delete('/:id/members/:userId', mongoId('id'), mongoId('userId'), validate, projectController.removeMember);

module.exports = router;
