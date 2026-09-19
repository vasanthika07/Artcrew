import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Film, RotateCcw, Volume2, VolumeX, Maximize, Pause, Play, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { toast } from './Toast';

const VideoPlayerModal = ({
  session,
  playbackUrl,
  initialPositionSeconds = 0,
  onClose,
  onProgressUpdate,
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(session?.durationSeconds || 0);
  const [completed, setCompleted] = useState(false);

  // Sync watch progress to backend
  const syncProgress = useCallback(
    async (timeInSeconds, totalDuration) => {
      if (!session?._id || !timeInSeconds || timeInSeconds <= 0) return;

      // Avoid spamming requests if position hasn't changed by at least 2 seconds
      if (Math.abs(timeInSeconds - lastSavedTimeRef.current) < 2) return;
      lastSavedTimeRef.current = timeInSeconds;

      try {
        await api.post(`/recordings/${session._id}/progress`, {
          progressSeconds: Math.round(timeInSeconds),
          durationSeconds: Math.round(totalDuration || duration),
        });
        if (onProgressUpdate) {
          onProgressUpdate(session._id, timeInSeconds, totalDuration);
        }
      } catch (err) {
        console.warn('[VideoPlayer] Progress sync error:', err.message);
      }
    },
    [session, duration, onProgressUpdate]
  );

  useEffect(() => {
    let intervalId = null;

    const initPlayer = async () => {
      const videojs = (await import('video.js')).default;
      await import('video.js/dist/video-js.css');

      if (videoRef.current && !playerRef.current) {
        const isHls = playbackUrl.includes('.m3u8');

        playerRef.current = videojs(videoRef.current, {
          autoplay: true,
          controls: true,
          responsive: true,
          fluid: true,
          playbackRates: [0.75, 1, 1.25, 1.5, 2],
          sources: [
            {
              src: playbackUrl,
              type: isHls ? 'application/x-mpegURL' : 'video/mp4',
            },
          ],
        });

        // Resume from initial position if available
        playerRef.current.ready(() => {
          if (initialPositionSeconds > 0) {
            playerRef.current.currentTime(initialPositionSeconds);
          }
        });

        playerRef.current.on('timeupdate', () => {
          if (playerRef.current) {
            const curr = playerRef.current.currentTime();
            const dur = playerRef.current.duration() || duration;
            setCurrentTime(curr);
            setDuration(dur);

            if (dur > 0 && curr / dur >= 0.9) {
              setCompleted(true);
            }
          }
        });

        playerRef.current.on('play', () => setIsPlaying(true));
        playerRef.current.on('pause', () => {
          setIsPlaying(false);
          if (playerRef.current) {
            syncProgress(playerRef.current.currentTime(), playerRef.current.duration());
          }
        });

        playerRef.current.on('ended', () => {
          setIsPlaying(false);
          setCompleted(true);
          if (playerRef.current) {
            syncProgress(playerRef.current.duration(), playerRef.current.duration());
          }
          toast.success('Workshop completed! Great work!');
        });
      }
    };

    initPlayer();

    // Periodic sync every 4 seconds while playing
    intervalId = setInterval(() => {
      if (playerRef.current && !playerRef.current.paused()) {
        syncProgress(playerRef.current.currentTime(), playerRef.current.duration());
      }
    }, 4000);

    // Keyboard listener for Escape to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('keydown', handleKeyDown);
      if (playerRef.current) {
        // Final progress sync on unmount
        try {
          const finalTime = playerRef.current.currentTime();
          const finalDur = playerRef.current.duration();
          if (finalTime > 0) {
            syncProgress(finalTime, finalDur);
          }
        } catch (e) {}
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [playbackUrl, initialPositionSeconds, syncProgress, onClose, duration]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 bg-charcoal-950/98 backdrop-blur-md z-50 flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${session?.title || 'Workshop'}`}
    >
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-800/80 bg-charcoal-900/50">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-canvas-500/20 text-canvas-400 flex items-center justify-center shrink-0">
            <Film className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold text-canvas-400 tracking-wider">
                {session?.mediumId?.name || 'Workshop'}
              </span>
              {completed && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            <h2 className="font-display font-semibold text-white text-base sm:text-lg truncate max-w-[60vw]">
              {session?.title || 'Recorded Art Session'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-charcoal-400 hidden sm:inline-block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            onClick={onClose}
            aria-label="Close video player"
            className="p-2.5 rounded-xl hover:bg-charcoal-800 text-charcoal-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-charcoal-800 bg-black">
          <div data-vjs-player>
            <video
              ref={videoRef}
              className="video-js vjs-big-play-centered vjs-theme-city vjs-fluid"
              playsInline
            />
          </div>
        </div>

        {/* Video Subtitle & Details */}
        {session?.instructor && (
          <div className="max-w-5xl w-full mt-4 flex items-center justify-between text-xs text-charcoal-400 px-2">
            <span>Instructor: <strong>{session.instructor}</strong></span>
            {session.description && (
              <span className="truncate max-w-md hidden md:inline-block">{session.description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
