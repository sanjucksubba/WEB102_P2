const supabase = require('../lib/supabase');

// Upload a file to Supabase storage
const uploadFile = async (bucket, filePath, fileBuffer, mimeType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) throw error;
  return data;
};

// Get public URL of a file
const getPublicUrl = (bucket, filePath) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  return data.publicUrl;
};

// Delete a file from Supabase storage
const deleteFile = async (bucket, filePath) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) throw error;
};

module.exports = { uploadFile, getPublicUrl, deleteFile };