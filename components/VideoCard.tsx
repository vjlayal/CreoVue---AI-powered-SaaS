import React, { useState, useCallback } from 'react'
import { getCldImageUrl, getCldVideoUrl } from 'next-cloudinary'
import { Download, Clock, FileDown, FileUp, X } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { filesize } from 'filesize'
import { Video } from '@/types'


dayjs.extend(relativeTime)

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
  onDelete: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 400,
      height: 300,
      crop: 'fill',
      gravity: 'auto',
      format: 'jpg',
      quality: 'auto',
      assetType: 'video'
    })
  }, []);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
    })
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 300,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"]
    })
  }, []);

  const formatSize = useCallback((size: number) => {
    return filesize(size);
  }, [])

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} `;
  }, [])

  const handlePreviewError = useCallback(() => {
    setPreviewError(true);
  }, [])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(video.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // derive duration in seconds (schema stores duration as string)
  const durationSeconds = React.useMemo(() => {
    const d = Number(video.duration);
    return Number.isFinite(d) ? d : 0;
  }, [video.duration]);

  // compression percentage (original -> compressed), guard divide-by-zero
  const compressionPercentage = React.useMemo(() => {
    const orig = Number(video.originalSize) || 0;
    const comp = Number(video.compressedSize) || 0;
    if (orig <= 0) return 0;
    const perc = ((orig - comp) / orig) * 100;
    return Math.round(perc);
  }, [video.originalSize, video.compressedSize]);


  return (
    <>
      <div
        className="card shadow-xl hover:shadow-2xl transition-all duration-300 rounded-b-3xl bg-stone-900 border-3 border-stone-400 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setPreviewError(false); }}
      >
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-10 bg-stone-800/80 hover:bg-red-600 text-white/70 hover:text-white rounded-full p-1.5 transition-all duration-200 backdrop-blur-sm"
          title="Delete video"
        >
          <X size={16} />
        </button>

        <figure className="aspect-video relative">
          {isHovered ? (
            previewError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-red-500">Preview not available!</p>
              </div>
            ) : (
              <video
                src={getPreviewVideoUrl(video.publicId)}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
                onError={handlePreviewError}
              />
            )
          ) : (
            <img
              src={getThumbnailUrl(video.publicId)}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 right-2 bg-stone-800 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
            <Clock size={16} className="mr-1" />
            {formatDuration(durationSeconds)}
          </div>
        </figure>
        <div className="card-body p-4">
          <h2 className="card-title text-lg font-bold ">{video.title}</h2>
          <p className="text-sm text-white opacity-80 mb-4">
            {video.description}
          </p>
          <p className="text-sm text-gray-400 opacity-70 mb-4">
            Uploaded {dayjs(video.createdAt).fromNow()}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <FileUp size={18} className="mr-2 text-primary" />
              <div>
                <div className="font-semibold ">Original</div>
                <div className='text-red-500'>{formatSize(Number(video.originalSize))}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileDown size={18} className="mr-2 text-secondary" />
              <div>
                <div className="font-semibold">Compressed</div>
                <div className='text-green-600'>{formatSize(Number(video.compressedSize))}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm font-semibold">
              {compressionPercentage <= 0 ? (
                <span className="text-green-500 font-bold">Already Optimized! ✅</span>
              ) : (
                <>
                  Compression:{" "}
                  <span className="text-green-600">{compressionPercentage}%</span>
                </>
              )}
            </div>
            <button
              className="btn rounded-b-xl bg-gray-800 border-2 border-stone-400 btn-sm p-4"
              onClick={() =>
                onDownload(getFullVideoUrl(video.publicId), video.title)
              }
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-600 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Video?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete <strong className="text-white">&quot;{video.title}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="btn btn-sm bg-stone-700 hover:bg-stone-600 border-stone-500 text-white rounded-lg px-4"
                disabled={isDeleting}
              >
                No, keep it
              </button>
              <button
                onClick={handleConfirmDelete}
                className="btn btn-sm bg-red-600 hover:bg-red-700 border-none text-white rounded-lg px-4"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VideoCard


