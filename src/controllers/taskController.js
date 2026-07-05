const taskService = require('../services/taskService');

const emitToProject = (req, event, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  const projectId = payload.projectId || payload.project || payload.task?.project;
  if (projectId) {
    io.to(`project:${projectId}`).emit(event, payload);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(
      req.params.projectId,
      req.user._id
    );
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.params.projectId,
      req.user._id,
      req.body
    );
    res.status(201).json({ success: true, data: task });
    emitToProject(req, 'task:created', { task });
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user._id);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.user._id,
      req.body
    );
    res.json({ success: true, data: task });
    emitToProject(req, 'task:updated', { task });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, order } = req.body;
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.user._id,
      status,
      order
    );
    res.json({ success: true, data: task });
    emitToProject(req, 'task:moved', { task });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { taskId, projectId } = await taskService.deleteTask(
      req.params.id,
      req.user._id
    );
    res.json({ success: true, data: { taskId } });
    emitToProject(req, 'task:deleted', { taskId, projectId });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  updateStatus,
  deleteTask,
};
