'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration?: string;
  author?: string;
}

interface DownloadOption {
  label: string;
  quality: string;
  format: 'mp4' | 'mp3';
}

const DOWNLOAD_OPTIONS: DownloadOption[] = [
  { label: 'MP3 Audio', quality: 'mp3', format: 'mp3' },
  { label: 'MP4 360p', quality: '360', format: 'mp4' },
  { label: 'MP4 480p', quality: '480', format: 'mp4' },
  { label: 'MP4 720p', quality: '720', format: 'mp4' },
  { label: 'MP4 1080p', quality: '1080', format: 'mp4' },
  { label: 'MP4 1440p', quality: '1440', format: 'mp4' },
];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace('www.', '');
    return (
      host === 'youtube.com' ||
      host === 'youtu.be' ||
      host === 'instagram.com'
    );
  } catch {
    return false;
  }
}

export default function Downloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState('');
  const [downloadingQuality, setDownloadingQuality] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please paste a video URL first.');
      return;
    }
    if (!isValidUrl(trimmed)) {
      setError('Please enter a valid YouTube or Instagram URL.');
      return;
    }

    setError('');
    setVideoInfo(null);
    setDownloadError('');
    setLoading(true);

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Could not fetch video info. Try another URL.');
      } else {
        setVideoInfo(data);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(option: DownloadOption) {
    if (downloadingQuality) return;
    setDownloadError('');
    setDownloadingQuality(option.quality);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), quality: option.quality, format: option.format }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setDownloadError(data.error || 'Download failed. Try a different quality.');
        return;
      }

      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        setDownloadError('No download link received. Please try again.');
      }
    } catch {
      setDownloadError('Download failed. Please try again.');
    } finally {
      setDownloadingQuality(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleFetch();
  }

  function handleReset() {
    setUrl('');
    setVideoInfo(null);
    setError('');
    setDownloadError('');
    setDownloadingQuality(null);
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Paste YouTube or Instagram URL here..."
          className="input-main flex-1"
          disabled={loading}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Fetching...
            </span>
          ) : 'Start →'}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
      )}

      {/* Video Info Card */}
      {videoInfo && (
        <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50 fade-in-up">
          <div className="flex gap-4 mb-5">
            {videoInfo.thumbnail && (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <Image
                  src={videoInfo.thumbnail}
                  alt="Video thumbnail"
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-3">
                {videoInfo.title}
              </h3>
              {videoInfo.author && (
                <p className="text-gray-500 text-xs">{videoInfo.author}</p>
              )}
              {videoInfo.duration && (
                <p className="text-gray-400 text-xs mt-1">⏱ {videoInfo.duration}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Choose Format</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {DOWNLOAD_OPTIONS.map((option) => (
              <button
                key={option.quality}
                onClick={() => handleDownload(option)}
                disabled={downloadingQuality !== null}
                className={`
                  py-2 px-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200
                  ${option.format === 'mp3'
                    ? 'border-primary bg-primary text-white hover:bg-primary-dark'
                    : 'border-primary text-primary hover:bg-primary hover:text-white'
                  }
                  ${downloadingQuality === option.quality ? 'opacity-70 cursor-wait' : ''}
                  ${downloadingQuality !== null && downloadingQuality !== option.quality ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {downloadingQuality === option.quality ? (
                  <span className="flex items-center justify-center gap-1">
                    <svg className="w-3 h-3 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Getting...
                  </span>
                ) : option.label}
              </button>
            ))}
          </div>

          {downloadError && (
            <p className="text-red-500 text-xs text-center mb-2">{downloadError}</p>
          )}

          <button
            onClick={handleReset}
            className="w-full text-gray-400 hover:text-gray-600 text-xs underline transition-colors"
          >
            ← Download another video
          </button>
        </div>
      )}
    </div>
  );
}
