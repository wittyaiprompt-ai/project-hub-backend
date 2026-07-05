const Task = require('../models/Task');
const Project = require('../models/Project');
const { AppError } = require('../middleware/errorHandler');

const taskPopulate = [
  { path: 'assignee', select: 'name email' },
  { path: 'createdBy', select: 'name email' },
];

const checkAccess = async (projectId, userId) => {
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

const getProjectTasks = async (projectId, userId) => {
  await checkAccess(projectId, userId);

  return Task.find({ project: projectId })
    .populate(taskPopulate)
    .sort({ status: 1, order: 1 });
};

const createTask = async (projectId, userId, data) => {
  await checkAccess(projectId, userId);

  const maxOrder = await Task.findOne({ project: projectId, status: data.status || 'todo' })
    .sort({ order: -1 })
    .select('order');

  const task = await Task.create({
    ...data,
    project: projectId,
    createdBy: userId,
    order: maxOrder ? maxOrder.order + 1 : 0,
  });

  return task.populate(taskPopulate);
};

const getTaskById = async (taskId, userId) => {
  const task = await Task.findById(taskId).populate(taskPopulate);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await checkAccess(task.project, userId);
  return task;
};

const updateTask = async (taskId, userId, data) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await checkAccess(task.project, userId);

  const allowed = ['title', 'description', 'priority', 'assignee', 'dueDate', 'status', 'order'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) {
      task[key] = data[key];
    }
  });

  await task.save();
  return task.populate(taskPopulate);
};

const updateTaskStatus = async (taskId, userId, status, order) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await checkAccess(task.project, userId);

  task.status = status;
  if (order !== undefined) {
    task.order = order;
  }

  await task.save();
  return task.populate(taskPopulate);
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await checkAccess(task.project, userId);

  const projectId = task.project;
  await task.deleteOne();

  return { taskId, projectId };
};

module.exports = {
  getProjectTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
