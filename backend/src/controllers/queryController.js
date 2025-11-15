const queryService = require('../services/queryService');
const { asyncHandler } = require('../middleware/errorHandler');

const getQueries = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    priority: req.query.priority,
    channelId: req.query.channelId,
    categoryId: req.query.categoryId,
    userId: req.query.userId || (req.user.role === 'AGENT' ? req.user.id : undefined),
    search: req.query.search,
    page: req.query.page || 1,
    limit: req.query.limit || 20,
    sortBy: req.query.sortBy || 'receivedAt',
    sortOrder: req.query.sortOrder || 'desc',
  };

  const result = await queryService.getQueries(filters);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const getQueryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = await queryService.getQueryById(id);

  res.status(200).json({
    status: 'success',
    data: { query },
  });
});

const createQuery = asyncHandler(async (req, res) => {
  const query = await queryService.createQuery(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Query created successfully',
    data: { query },
  });
});

const updateQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = await queryService.updateQuery(id, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Query updated successfully',
    data: { query },
  });
});

const deleteQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await queryService.deleteQuery(id);

  res.status(200).json({
    status: 'success',
    message: 'Query deleted successfully',
  });
});

const assignQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, notes } = req.body;

  const assignment = await queryService.assignQuery(id, userId, req.user.id, notes);

  res.status(200).json({
    status: 'success',
    message: 'Query assigned successfully',
    data: { assignment },
  });
});

module.exports = {
  getQueries,
  getQueryById,
  createQuery,
  updateQuery,
  deleteQuery,
  assignQuery,
};

