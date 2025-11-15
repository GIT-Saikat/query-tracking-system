const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');

const getUsers = asyncHandler(async (req, res) => {
  const filters = {
    role: req.query.role,
    department: req.query.department,
    isActive: req.query.isActive,
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  };

  const result = await userService.getUsers(filters);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.updateUser(id, req.body);

  res.status(200).json({
    status: 'success',
    message: 'User updated successfully',
    data: { user },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await userService.deleteUser(id);

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};

