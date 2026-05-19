'use client';

import { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import { getAllVideos } from '../../services/videoService';
import AuthModal from '../auth/AuthModal';

export default function VideoFeed() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchVideos = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await getAllVideos(pageNum, 10);
      const videoList = Array.isArray(data) ? data : data.videos || [];
      if (pageNum === 1) {
        setVideos(videoList);
      } else {
        setVideos((prev) => [...prev, ...videoList]);
      }
      setHasMore(videoList.length === 10);
      setError(null);
    } catch (err) {
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchVideos(nextPage);
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading videos...</p>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => fetchVideos(1)}
          className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600">
          Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 text-lg">No videos yet. Be the first to upload!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="space-y-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onAuthRequired={() => setIsAuthModalOpen(true)}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button onClick={loadMore} disabled={loading}
            className="px-8 py-3 bg-gray-100 rounded-full hover:bg-gray-200 font-medium disabled:opacity-50">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}