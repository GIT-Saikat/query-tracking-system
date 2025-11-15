const responseService = require('../services/responseService');
const { asyncHandler } = require('../middleware/errorHandler');

const getResponses = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const result = await responseService.getResponses(queryId);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

const createResponse = asyncHandler(async (req, res) => {
  const { queryId, content, isInternal, attachments } = req.body;

  const response = await responseService.createResponse({
    queryId,
    userId: req.user.id,
    content,
    isInternal,
    attachments,
  });

  res.status(201).json({
    status: 'success',
    message: 'Response created successfully',
    data: { response },
  });
});

const updateResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const response = await responseService.updateResponse(id, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Response updated successfully',
    data: { response },
  });
});

const deleteResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await responseService.deleteResponse(id);

  res.status(200).json({
    status: 'success',
    message: 'Response deleted successfully',
  });
});

module.exports = {
  getResponses,
  createResponse,
  updateResponse,
  deleteResponse,
};

