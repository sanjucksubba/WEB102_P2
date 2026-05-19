'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/authContext';
import { likeVideo, unlikeVideo, getComments, postComment } from '@/services/videoService';
import toast from 'react-hot-toast';

export default function VideoCard({ video, onAuthRequired }) {
  const { user } = useAuth();
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(video?.isLiked || false);
  const [likesCount, setLikesCount] = useState(video?.likesCount || video?._count?.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  if (!video) return null;

  // ✅ NEW: Handle both Supabase URLs and legacy local URLs
  const getFullVideoUrl = (url) => {
    if (!url) return '';
    // Already a full URL (Supabase or any external URL)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Legacy local file — point to your backend
    return `${process.env.NEXT_PUBLIC_API_URL}/${url}`;
  };

  const videoUrl = getFullVideoUrl(video.videoUrl || video.video_url);
  const thumbnailUrl = getFullVideoUrl(video.thumbnailUrl || video.thumbnail_url);
  const author = video.user || video.author || {};

  // Auto-play when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLike = async () => {
    if (!user) { onAuthRequired?.(); return; }
    try {
      if (liked) {
        await unlikeVideo(video.id);
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await likeVideo(video.id);
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleOpenComments = async () => {
    setShowComments(true);
    setCommentsLoading(true);
    try {
      const data = await getComments(video.id);
      setComments(Array.isArray(data) ? data : data.comments || []);
    } catch (error) {
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) { onAuthRequired?.(); return; }
    if (!newComment.trim()) return;
    try {
      const comment = await postComment(video.id, newComment);
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const formatCount = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n?.toString() || '0';
  };

  return (
    <div className="relative flex gap-4 mb-8 max-w-2xl">
      {/* Author avatar */}
      <div className="flex-shrink-0">
        <Link href={`/profile/${author.id}`}>
          <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
            {author.avatar ? (
              <img src={author.avatar} alt={author.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-400 text-white font-bold text-lg">
                {author.username?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Video + Info */}
      <div className="flex-1">
        <div className="mb-2">
          <Link href={`/profile/${author.id}`} className="font-bold text-gray-900 hover:underline">
            @{author.username || 'unknown'}
          </Link>
          <p className="text-gray-600 text-sm mt-0.5">{video.caption || video.description}</p>
        </div>

        {/* Video player */}
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ maxWidth: '340px', aspectRatio: '9/16' }}>
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
            onClick={togglePlay}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
              <div className="bg-black bg-opacity-40 rounded-full p-4">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
          <button onClick={toggleMute}
            className="absolute bottom-3 right-3 bg-black bg-opacity-50 rounded-full p-1.5 text-white">
            {isMuted ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col items-center justify-end gap-4 pb-4">
        {/* Like */}
        <div className="flex flex-col items-center">
          <button onClick={handleLike}
            className={`p-2 rounded-full ${liked ? 'text-red-500' : 'text-gray-700'} hover:bg-gray-100`}>
            <svg className="w-8 h-8" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={liked ? 0 : 2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <span className="text-xs text-gray-600 font-semibold">{formatCount(likesCount)}</span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center">
          <button onClick={handleOpenComments}
            className="p-2 rounded-full text-gray-700 hover:bg-gray-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <span className="text-xs text-gray-600 font-semibold">
            {formatCount(video._count?.comments || video.commentsCount || 0)}
          </span>
        </div>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setShowComments(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg h-[70vh] flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {commentsLoading ? (
                <p className="text-center text-gray-400">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-center text-gray-400">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">@{comment.user?.username}</p>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="p-4 border-t flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? 'Add a comment...' : 'Login to comment'}
                disabled={!user}
                className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:border-red-400"
              />
              <button type="submit" disabled={!user || !newComment.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold disabled:opacity-40">
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}