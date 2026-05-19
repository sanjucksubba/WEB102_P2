const prisma = require('../lib/prisma');

exports.getComments = async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);

    const comments = await prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } },
        _count: { select: { likes: true } }
      }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const { text } = req.body;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const comment = await prisma.comment.create({
      data: { text, userId: req.user.id, videoId },
      include: {
        user: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { text } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { text }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.likeComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = req.user.id;

    const existingLike = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } }
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } }
      });
      return res.json({ message: 'Comment unliked' });
    }

    await prisma.commentLike.create({ data: { userId, commentId } });
    res.json({ message: 'Comment liked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};