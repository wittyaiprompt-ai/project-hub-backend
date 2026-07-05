const userService = require('../services/userService');

const listAvailable = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const users = await userService.listAvailableForProject(projectId, req.user._id);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAvailable };
