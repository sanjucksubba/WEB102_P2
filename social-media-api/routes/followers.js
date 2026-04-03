// routes/followers.js
const express = require('express');
const {
  getFollowers,
  getFollower,
  createFollower,
  deleteFollower
} = require('../controllers/followerController');

const router = express.Router();

router.route('/').get(getFollowers).post(createFollower);
router.route('/:id').get(getFollower).delete(deleteFollower);

module.exports = router;