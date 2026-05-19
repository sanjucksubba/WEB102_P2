'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/authContext';
import { uploadVideo } from '@/services/videoService';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, authLoading]);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size must be less than 100MB');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, video: '' }));
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const newErrors = {};
    if (!videoFile) newErrors.video = 'Please select a video to upload';
    if (!caption.trim()) newErrors.caption = 'Please add a caption';
    else if (caption.length > 150) newErrors.caption = 'Caption must be 150 characters or less';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setIsAuthModalOpen(true); return; }
    if (!validate()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('caption', caption);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      await uploadVideo(formData);
      toast.success('Video uploaded successfully!');
      router.push('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setCaption('');
    setErrors({});
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Upload Video</h1>
        <p className="text-gray-500 mb-8">Share your video with the community</p>

        {!user && !authLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">You need to be logged in to upload videos</p>
            <button onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600">
              Log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Video *</label>
              {!videoPreview ? (
                <div onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer hover:border-red-400 transition-colors ${
                    errors.video ? 'border-red-500' : 'border-gray-200'
                  }`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Click to select video</p>
                      <p className="text-sm text-gray-400 mt-1">MP4, MOV, AVI — max 100MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video src={videoPreview} controls className="w-full max-h-96 object-contain" />
                  <button type="button" onClick={handleReset}
                    className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {errors.video && <p className="text-red-500 text-xs mt-1">{errors.video}</p>}
              <input ref={videoInputRef} type="file" accept="video/*"
                onChange={handleVideoSelect} className="hidden" />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thumbnail <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-4">
                {thumbnailPreview ? (
                  <div className="relative w-24 h-36 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div onClick={() => thumbnailInputRef.current?.click()}
                    className="w-24 h-36 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Upload a cover image for your video</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG — recommended 1080×1920</p>
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                    className="mt-2 text-sm text-red-500 hover:underline">
                    {thumbnailPreview ? 'Change thumbnail' : 'Choose thumbnail'}
                  </button>
                </div>
              </div>
              <input ref={thumbnailInputRef} type="file" accept="image/*"
                onChange={handleThumbnailSelect} className="hidden" />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Caption *</label>
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  if (errors.caption) setErrors((prev) => ({ ...prev, caption: '' }));
                }}
                placeholder="Write a caption for your video..."
                maxLength={150}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-red-400 ${
                  errors.caption ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.caption
                  ? <p className="text-red-500 text-xs">{errors.caption}</p>
                  : <span />
                }
                <p className={`text-xs ${caption.length > 130 ? 'text-red-400' : 'text-gray-400'}`}>
                  {caption.length}/150
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleReset} disabled={isUploading}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Reset
              </button>
              <button type="submit" disabled={isUploading || !videoFile}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        )}
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </MainLayout>
  );
}