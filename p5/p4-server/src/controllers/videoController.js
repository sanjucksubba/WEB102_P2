const prisma = require('../lib/prisma');
const { uploadFile, getPublicUrl, deleteFile } = require('../services/storageService');

exports.getAllVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, name: true, avatar: true } },
          _count: { select: { likes: true, comments: true } }
        }
      }),
      prisma.video.count()
    ]);

    res.json({ videos, page, totalPages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const video = await prisma.video.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } }
      }
    });
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getFollowingVideos = async (req, res) => {
  try {
    const userId = req.user.id;
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    const videos = await prisma.video.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { likes: true, comments: true } }
      }
    });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { caption } = req.body;
    const userId = req.user.id;

    let videoUrl = null;
    let thumbnailUrl = null;
    let videoStoragePath = null;
    let thumbnailStoragePath = null;

    if (req.files && req.files.video) {
      const videoFile = req.files.video[0];
      const videoPath = `${userId}/${Date.now()}-${videoFile.originalname}`;
      await uploadFile('videos', videoPath, videoFile.buffer, videoFile.mimetype);
      videoStoragePath = videoPath;
      videoUrl = getPublicUrl('videos', videoPath);
    }

    if (req.files && req.files.thumbnail) {
      const thumbFile = req.files.thumbnail[0];
      const thumbPath = `${userId}/${Date.now()}-${thumbFile.originalname}`;
      await uploadFile('thumbnails', thumbPath, thumbFile.buffer, thumbFile.mimetype);
      thumbnailStoragePath = thumbPath;
      thumbnailUrl = getPublicUrl('thumbnails', thumbPath);
    }

    const video = await prisma.video.create({
      data: {
        caption,
        videoUrl,
        thumbnailUrl,
        videoStoragePath,
        thumbnailStoragePath,
        userId
      },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(video);
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { caption } = req.body;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const updated = await prisma.video.update({
      where: { id: videoId },
      data: { caption }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    if (video.videoStoragePath) await deleteFile('videos', video.videoStoragePath);
    if (video.thumbnailStoragePath) await deleteFile('thumbnails', video.thumbnailStoragePath);

    await prisma.video.delete({ where: { id: videoId } });
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleVideoLike = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const userId = req.user.id;

    const existingLike = await prisma.videoLike.findUnique({
      where: { userId_videoId: { userId, videoId } }
    });

    if (existingLike) {
      await prisma.videoLike.delete({
        where: { userId_videoId: { userId, videoId } }
      });
      return res.json({ message: 'Video unliked' });
    }

    await prisma.videoLike.create({ data: { userId, videoId } });
    res.json({ message: 'Video liked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getVideoComments = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { content } = req.body;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const comment = await prisma.comment.create({
      data: { content, userId: req.user.id, videoId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};