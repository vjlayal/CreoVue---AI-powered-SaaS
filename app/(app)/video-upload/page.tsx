"use client"
import React, { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import FeatureGate from '@/components/FeatureGate';

function VideoUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const router = useRouter()
  const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB
  const [error, setError] = useState<string | null>(null)
  const [videoCount, setVideoCount] = useState(0)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/videos');
        setVideoCount(response.data.length);
      } catch (err) {
        console.error("Failed to fetch video count", err);
      }
    };
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size too large. Max limit is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
      return;
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Get a signed upload URL from our server (validates user + rate limits)
      const signResponse = await axios.post("/api/video-upload/sign")
      const { signature, timestamp, cloudName, apiKey, folder, transformation } = signResponse.data

      // Step 2: Upload directly to Cloudinary (bypasses Vercel body size limit)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature", signature)
      formData.append("timestamp", String(timestamp))
      formData.append("api_key", apiKey)
      formData.append("folder", folder)
      formData.append("resource_type", "video")
      formData.append("transformation", transformation)

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percent)
            }
          },
        }
      )

      const cloudinaryResult = cloudinaryResponse.data

      // Step 3: Save video metadata to our database
      await axios.post("/api/video-upload/save", {
        title,
        description,
        originalSize: file.size,
        publicId: cloudinaryResult.public_id,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
        duration: cloudinaryResult.duration,
      })

      router.push("/")
    } catch (err: any) {
      console.error(err)
      // Handle error from either our server or Cloudinary
      const errorData = err.response?.data?.error;
      let errorMessage: string;
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else {
        errorMessage = "Video upload failed. Please try again.";
      }
      setError(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }

  }


  return (
    <FeatureGate>
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <div className={`badge badge-lg p-4 ${videoCount >= 10 ? 'badge-error' : 'badge-neutral'}`}>
          Usage: {videoCount} / 10 Videos
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text text-xl pb-2">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input border border-stone-300 rounded-md w-full"
            required
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text text-xl pb-2">Description</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea border border-stone-300 rounded-md w-full"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text text-xl pb-2">Video File</span>
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input w-full border-none "
            required
          />
          <p className="text-sm text-gray-500 mt-1">Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB</p>
        </div>

        {isUploading && uploadProgress > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <progress
              className="progress progress-primary w-full"
              value={uploadProgress}
              max="100"
            />
          </div>
        )}

        <button
          type="submit"
          className="btn border-none bg-gray-800 text-white rounded-md mt-4"
          disabled={isUploading}
        >
          {isUploading ? `Uploading... ${uploadProgress > 0 ? `(${uploadProgress}%)` : ''}` : "Upload Video"}
        </button>
      </form>
    </div>
    </FeatureGate>
  );
}

export default VideoUpload
