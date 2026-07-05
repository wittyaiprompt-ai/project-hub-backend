const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const populateFields = [
  { path: 'owner', select: 'name email' },
  { path: 'members', select: 'name email' },
];

const getUserProjects = async (userId) => {
  return Project.find({ members: userId })
    .populate(populateFields)
    .sort({ updatedAt: -1 });
};

const createProject = async (userId, data) => {
  const project = await Project.create({
    ...data,
    owner: userId,
    members: [userId],
  });

  return project.populate(populateFields);
};

const getProjectById = async (projectId, userId) => {
  const project = await Project.findById(projectId).populate(populateFields);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const isMember = project.members.some(
    (m) => m._id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  return project;
};

const updateProject = async (projectId, userId, data) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the owner can update this project', 403);
  }

  Object.assign(project, data);
  await project.save();

  return project.populate(populateFields);
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the owner can delete this project', 403);
  }

  await Task.deleteMany({ project: projectId });
  await project.deleteOne();

  return { message: 'Project deleted' };
};

const addMember = async (projectId, userId, email) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the owner can add members', 403);
  }

  const newMember = await User.findOne({ email: email.toLowerCase() });
  if (!newMember) {
    throw new AppError('User not found with that email', 404);
  }

  const alreadyMember = project.members.some(
    (m) => m.toString() === newMember._id.toString()
  );

  if (alreadyMember) {
    throw new AppError('User is already a member', 409);
  }

  project.members.push(newMember._id);
  await project.save();

  const populated = await project.populate(populateFields);
  const member = populated.members.find(
    (m) => m._id.toString() === newMember._id.toString()
  );

  return { project: populated, member };
};

const removeMember = async (projectId, userId, memberId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.owner.toString() !== userId.toString()) {
    throw new AppError('Only the owner can remove members', 403);
  }

  if (memberId === project.owner.toString()) {
    throw new AppError('Cannot remove the project owner', 400);
  }

  project.members = project.members.filter(
    (m) => m.toString() !== memberId
  );

  await project.save();
  return project.populate(populateFields);
};

module.exports = {
  getUserProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
