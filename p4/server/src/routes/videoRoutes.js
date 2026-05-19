const express = require('express');
const router = express.Router();
const { getVideos, getVideoById, createVideo, updateVideo, deleteVideo, likeVideo, getUserVideos } = require('../controllers/videoController');
const { getComments, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/', getVideos);
router.get('/user/:userId', getUserVideos);
router.get('/:id', getVideoById);
router.get('/:videoId/comments', getComments);
router.post('/', protect, createVideo);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/like', protect, likeVideo);
router.post('/:videoId/comments', protect, addComment);

module.exports = router;