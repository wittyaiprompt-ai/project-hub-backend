const User = require('../models/User');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

const listAvailableForProject = async (projectId, requesterId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.owner.toString() !== requesterId.toString()) {
    throw new AppError('Only the project owner can invite members', 403);
  }

  return User.find({ _id: { $nin: project.members } })
    .select('name email')
    .sort({ name: 1 });
};

module.exports = { listAvailableForProject };
