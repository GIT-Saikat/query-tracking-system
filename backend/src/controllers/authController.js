const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, department, skills } = req.body;

  const result = await authService.register({
    email,
    password,
    firstName,
    lastName,
    role,
    department,
    skills,
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: result,
  });
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
};

