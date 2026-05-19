const prisma = require('../lib/prisma');

exports.getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        skip,
        take: limit,
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

exports.createVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnail } = req.body;

    const video = await prisma.video.create({
      data: { title, description, videoUrl, thumbnail, userId: req.user.id },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const videoId = parseInt(req.params.id);
    const { title, description, thumbnail } = req.body;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const updated = await prisma.video.update({
      where: { id: videoId },
      data: { title, description, thumbnail }
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

    await prisma.video.delete({ where: { id: videoId } });
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likeVideo = async (req, res) => {
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

exports.getUserVideos = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const videos = await prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { likes: true, comments: true } }
      }
    });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};