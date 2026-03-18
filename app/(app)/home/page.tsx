"use client"

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import VideoCard from "@/components/VideoCard"
import { Video } from "@/types"


function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get('/api/videos')
      if (Array.isArray(response.data)) {
        setVideos(response.data)
      } else {
        throw new Error('Invalid data format')
      }
    } catch (error) {
      console.log(error)
      setError("Failed to load videos.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title}.mp4`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [])

  const handleDelete = useCallback(async (videoId: string) => {
    try {
      await axios.delete(`/api/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err) {
      console.error('Failed to delete video', err);
    }
  }, [])

  if (loading) {
    return <div>Loading videos...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 p-4">Videos</h1>
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-stone-900/50 border border-stone-800 rounded-2xl text-center">
          <div className="bg-stone-800 p-4 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-stone-400"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18" />
              <path d="M3 7.5h4" />
              <path d="M3 12h18" />
              <path d="M3 16.5h4" />
              <path d="M17 3v18" />
              <path d="M17 7.5h4" />
              <path d="M17 16.5h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No videos yet</h2>
          <p className="text-stone-400 max-w-sm mb-6">
            Get started by uploading your first video to be automatically processed and optimized.
          </p>
          <a href="/video-upload" className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 border-none text-white rounded-lg px-6">
            Upload Video
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 rounded-3xl w-full">
          {
            videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}

export default Home