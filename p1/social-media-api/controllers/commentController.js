const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { comments, users, posts } = require('../utils/mockData');

// @desc    Get all comments
// @route   GET /comments
// @access  Public
exports.getComments = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = comments.length;

  const results = comments.slice(startIndex, endIndex);

  const pagination = {};
  if (endIndex < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({
    success: true,
    count: results.length,
    page,
    total_pages: Math.ceil(total / limit),
    pagination,
    data: results
  });
});

// @desc    Get single comment
// @route   GET /comments/:id
// @access  Public
exports.getComment = asyncHandler(async (req, res, next) => {
  const comment = comments.find(c => c.id === req.params.id);
  if (!comment) {
    return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: comment });
});

// @desc    Create comment
// @route   POST /comments
// @access  Private
exports.createComment = asyncHandler(async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) return next(new ErrorResponse('Not authorized', 401));

  const newComment = {
    id: (comments.length + 1).toString(),
    text: req.body.text,
    user_id: userId,
    post_id: req.body.post_id,
    created_at: new Date().toISOString().slice(0, 10)
  };

  comments.push(newComment);
  res.status(201).json({ success: true, data: newComment });
});

// @desc    Update comment
// @route   PUT /comments/:id
// @access  Private
exports.updateComment = asyncHandler(async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) return next(new ErrorResponse('Not authorized', 401));

  const comment = comments.find(c => c.id === req.params.id);
  if (!comment) return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404));
  if (comment.user_id !== userId) return next(new ErrorResponse('Not authorized to update this comment', 401));

  const index = comments.findIndex(c => c.id === req.params.id);
  comments[index] = { ...comment, ...req.body, id: comment.id, user_id: comment.user_id };

  res.status(200).json({ success: true, data: comments[index] });
});

// @desc    Delete comment
// @route   DELETE /comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) return next(new ErrorResponse('Not authorized', 401));

  const comment = comments.find(c => c.id === req.params.id);
  if (!comment) return next(new ErrorResponse(`Comment not found with id of ${req.params.id}`, 404));
  if (comment.user_id !== userId) return next(new ErrorResponse('Not authorized to delete this comment', 401));

  const index = comments.findIndex(c => c.id === req.params.id);
  comments.splice(index, 1);

  res.status(200).json({ success: true, data: {} });
});