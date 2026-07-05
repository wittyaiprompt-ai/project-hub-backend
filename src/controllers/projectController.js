const projectService = require('../services/projectService');

const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user._id);
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user._id, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.user._id
    );
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.user._id,
      req.body
    );
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(
      req.params.id,
      req.user._id
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const result = await projectService.addMember(
      req.params.id,
      req.user._id,
      req.body.email
    );
    res.json({ success: true, data: result });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('member:added', {
        projectId: req.params.id,
        member: result.member,
      });
    }
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeMember(
      req.params.id,
      req.user._id,
      req.params.userId
    );
    res.json({ success: true, data: project });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('member:removed', {
        projectId: req.params.id,
        userId: req.params.userId,
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
