'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import VideoCard from '@/components/ui/VideoCard';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/authContext';
import { getFollowingVideos } from '@/services/videoService';

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setIsAuthModalOpen(true);
      setLoading(false);
      return;
    }
    if (user) fetchFollowingVideos();
  }, [user, authLoading]);

  const fetchFollowingVideos = async () => {
    try {
      setLoading(true);
      const data = await getFollowingVideos();
      const videoList = Array.isArray(data) ? data : data.videos || [];
      setVideos(videoList);
    } catch (err) {
      setError('Failed to load following feed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Following</h1>

        {!user && !authLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-gray-500 text-lg">Log in to see videos from people you follow</p>
            <button onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 font-semibold">
              Log in
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500">Loading following feed...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-red-500">{error}</p>
            <button onClick={fetchFollowingVideos}
              className="px-6 py-2 bg-red-500 text-white rounded-full">
              Retry
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700">You're not following anyone yet</h2>
            <p className="text-gray-500">Follow users to see their videos here</p>
            <button onClick={() => router.push('/explore-users')}
              className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 font-semibold">
              Explore Users
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onAuthRequired={() => setIsAuthModalOpen(true)}
              />
            ))}
          </div>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </MainLayout>
  );
}