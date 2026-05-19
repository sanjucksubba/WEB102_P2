import api from '@/lib/api-config';

// Named exports for VideoCard imports
export const getAllVideos = async (page = 1, limit = 10) => {
  const response = await api.get(`/videos?page=${page}&limit=${limit}`);
  return response.data;
};

export const getFollowingVideos = async (page = 1, limit = 10) => {
  const response = await api.get(`/videos/following?page=${page}&limit=${limit}`);
  return response.data;
};

export const getVideoById = async (videoId) => {
  const response = await api.get(`/videos/${videoId}`);
  return response.data;
};

export const getUserVideos = async (userId) => {
  const response = await api.get(`/users/${userId}/videos`);
  return response.data;
};

export const uploadVideo = async (formData) => {
  const response = await api.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const likeVideo = async (videoId) => {
  const response = await api.post(`/videos/${videoId}/like`);
  return response.data;
};

export const unlikeVideo = async (videoId) => {
  const response = await api.delete(`/videos/${videoId}/like`);
  return response.data;
};

export const getComments = async (videoId) => {
  const response = await api.get(`/videos/${videoId}/comments`);
  return response.data;
};

export const postComment = async (videoId, content) => {
  const response = await api.post('/comments', { videoId, content });
  return response.data;
};

export const deleteVideo = async (videoId) => {
  const response = await api.delete(`/videos/${videoId}`);
  return response.data;
};

// Default export for VideoFeed imports
const videoService = {
  getAllVideos,
  getFollowingVideos,
  getVideoById,
  getUserVideos,
  uploadVideo,
  likeVideo,
  unlikeVideo,
  getComments,
  postComment,
  deleteVideo,
};

export default videoService;