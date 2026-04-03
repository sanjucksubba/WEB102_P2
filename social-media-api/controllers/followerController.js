const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { followers } = require('../utils/mockData');

exports.getFollowers = asyncHandler(async (req, res, next) => {
  res.status(200).json({ success: true, count: followers.length, data: followers });
});

exports.getFollower = asyncHandler(async (req, res, next) => {
  const follower = followers.find(f => f.id === req.params.id);
  if (!follower) return next(new ErrorResponse(`Follower not found with id of ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: follower });
});

exports.createFollower = asyncHandler(async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) return next(new ErrorResponse('Not authorized', 401));

  const alreadyFollowing = followers.find(
    f => f.follower_id === userId && f.following_id === req.body.following_id
  );
  if (alreadyFollowing) return next(new ErrorResponse('Already following this user', 400));

  const newFollower = {
    id: (followers.length + 1).toString(),
    follower_id: userId,
    following_id: req.body.following_id,
    created_at: new Date().toISOString().slice(0, 10)
  };

  followers.push(newFollower);
  res.status(201).json({ success: true, data: newFollower });
});

exports.deleteFollower = asyncHandler(async (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (!userId) return next(new ErrorResponse('Not authorized', 401));

  const follower = followers.find(f => f.id === req.params.id);
  if (!follower) return next(new ErrorResponse(`Follower not found with id of ${req.params.id}`, 404));
  if (follower.follower_id !== userId) return next(new ErrorResponse('Not authorized', 401));

  const index = followers.findIndex(f => f.id === req.params.id);
  followers.splice(index, 1);

  res.status(200).json({ success: true, data: {} });
});