import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, SkipForward } from 'lucide-react';
import api from '../api/axios';
import { fetchPlaybackInfo, resolveVideoUrl, trackRecommendationEvent } from '../api/media';

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [playbackHint, setPlaybackHint] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [fallbackUrls, setFallbackUrls] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  
  let controlsTimeout = null;
  const historyRecorded = useRef(false);
  const lastSaveRef = useRef(0);
  const fallbackIndexRef = useRef(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setVideoError('');
        setDemoMode(false);
        const [movieRes, playRes] = await Promise.all([
          api.get(`/movies/${id}`),
          fetchPlaybackInfo(api, id),
        ]);
        setMovie(movieRes.data);
        const play = playRes;
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const backendStream = resolveVideoUrl(movieRes.data);
        const directUrl = movieRes.data?.videoUrl?.startsWith('http') ? movieRes.data.videoUrl : '';
        const backupUrls = [
          ...parseFallbackUrls(movieRes.data?.fallbackVideoUrls),
          ...defaultSampleFallbackUrls,
        ];
        const nextStreamUrl = play.sourceType === 'remote'
          ? backendStream
          : play.streamUrl?.startsWith('http')
            ? play.streamUrl
            : play.streamUrl
              ? `${base}${play.streamUrl}`
              : backendStream;
        setStreamUrl(nextStreamUrl);
        setFallbackUrls(play.sourceType === 'local'
          ? []
          : [directUrl, ...backupUrls].filter((url, index, list) => url && url !== nextStreamUrl && list.indexOf(url) === index));
        setPlaybackHint(play.ready ? '' : (play.message || ''));
        fallbackIndexRef.current = 0;
        if (!play.ready) {
          setDemoMode(true);
          setDuration(120);
          setIsPlaying(true);
        }
      } catch (err) {
        console.error(err);
        setVideoError('Could not load movie. Is backend running?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (loading || !id) return;
    api.get('/continue').then((res) => {
      const item = res.data.find((c) => c.movieId === Number(id));
      if (item && videoRef.current) {
        videoRef.current.currentTime = item.progressSeconds;
        setCurrentTime(item.progressSeconds);
      }
    }).catch(() => {});
  }, [loading, id]);

  const saveProgress = () => {
    if (!videoRef.current || !id) return;
    const progress = Math.floor(videoRef.current.currentTime);
    const duration = Math.floor(videoRef.current.duration) || 0;
    if (duration <= 0) return;
    api.post(`/continue/${id}`, { progressSeconds: progress, durationSeconds: duration }).catch(() => {});
  };

  const recordHistoryOnce = () => {
    if (historyRecorded.current) return;
    historyRecorded.current = true;
    api.post(`/history/${id}`).catch((err) => {
      historyRecorded.current = false;
      console.error('Watch history save failed', err);
    });
    trackRecommendationEvent(api, { movieId: Number(id), eventType: 'PLAY', context: 'player' }).catch(() => {});
  };

  // Bind Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((!videoRef.current && !demoMode) || loading) return;

      switch (e.key) {
        case ' ': // Spacebar
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft': // Seek back
          e.preventDefault();
          rewind();
          break;
        case 'ArrowRight': // Seek forward
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp': // Volume up
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(prev + 0.1, 1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'ArrowDown': // Volume down
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(prev - 0.1, 0);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'f':
        case 'F': // Fullscreen
          e.preventDefault();
          handleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, loading]);

  // Handle playing state
  const handlePlayPause = () => {
    if (demoMode) {
      setIsPlaying((value) => !value);
      recordHistoryOnce();
      handleMouseMove();
      return;
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      recordHistoryOnce();
    }
    handleMouseMove();
  };

  // Skip 10s forward
  const skipForward = () => {
    if (demoMode) {
      setCurrentTime((time) => Math.min(time + 10, duration || 120));
    } else if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  // Rewind 10s backward
  const rewind = () => {
    if (demoMode) {
      setCurrentTime((time) => Math.max(time - 10, 0));
    } else if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };

  // Handle progress/timeline tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (time - lastSaveRef.current >= 10) {
        lastSaveRef.current = time;
        saveProgress();
        trackRecommendationEvent(api, {
          movieId: Number(id),
          eventType: 'PLAY',
          watchSeconds: Math.floor(time),
          context: 'progress',
        }).catch(() => {});
      }
      if (time >= 5 && time <= 25) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (demoMode) {
      setCurrentTime(seekTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (demoMode) {
      setIsMuted((value) => !value);
    } else if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Volume slider change
  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  // Fullscreen trigger
  const handleFullscreen = () => {
    if (demoMode && canvasRef.current) {
      canvasRef.current.requestFullscreen?.();
    } else if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) { /* Safari */
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) { /* IE11 */
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  const handleSkipIntroAction = () => {
    if (demoMode) {
      setCurrentTime(30);
      setShowSkipIntro(false);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 30; // Skip straight past intro to 30s
      setShowSkipIntro(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Auto hide controls when mouse stops moving
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, []);

  const activeVideoUrl = streamUrl || (movie ? resolveVideoUrl(movie) : '');

  const handleVideoError = () => {
    const nextFallback = fallbackUrls[fallbackIndexRef.current];
    if (nextFallback) {
      fallbackIndexRef.current += 1;
      setVideoError('');
      setStreamUrl(nextFallback);
      return;
    }

    setVideoError(
      playbackHint ||
        'This local video file reached the browser, but it could not play. Convert it to H.264 video + AAC audio MP4.'
    );
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!demoMode) return undefined;
    const timer = setInterval(() => {
      setCurrentTime((time) => {
        if (!isPlaying) return time;
        const next = Math.min(time + 1, 120);
        if (next >= 120) setIsPlaying(false);
        setShowSkipIntro(next >= 5 && next <= 25);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [demoMode, isPlaying]);

  useEffect(() => {
    if (!demoMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#080808');
    gradient.addColorStop(0.55, '#171717');
    gradient.addColorStop(1, '#3a070b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(229, 9, 20, 0.18)';
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    for (let i = 0; i < 34; i += 1) {
      const x = ((i * 79 + currentTime * 42) % (w + 120)) - 60;
      const y = 90 + ((i * 43) % (h - 190));
      ctx.fillStyle = `rgba(255,255,255,${0.035 + (i % 5) * 0.014})`;
      ctx.fillRect(x, y, 90 + (i % 4) * 26, 2);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '900 58px Arial, sans-serif';
    ctx.fillText(movie?.title || 'Netflix Demo', 70, 120);
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = '#d7d7d7';
    ctx.fillText('Demo playback - upload a local MP4 for real movie video', 72, 162);
    ctx.fillStyle = '#e50914';
    ctx.fillRect(72, h - 116, Math.max(10, (currentTime / 120) * (w - 144)), 6);
  }, [demoMode, currentTime, movie?.title]);

  if (loading) {
    return (
      <div className="player-loading">
        <div className="player-loading-bar" />
        <p>Loading {movie?.title || 'movie'}...</p>
      </div>
    );
  }

  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {videoError && (
        <div style={{
          position: 'absolute',
          zIndex: 200,
          background: 'rgba(0,0,0,0.85)',
          padding: '24px 32px',
          borderRadius: '8px',
          maxWidth: '480px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <p style={{ marginBottom: '16px' }}>{videoError}</p>
          <button type="button" className="btn-primary" onClick={() => navigate(-1)}>Go back</button>
        </div>
      )}

      {demoMode ? (
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={handlePlayPause}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      ) : (
        <video
          key={activeVideoUrl}
          ref={videoRef}
          src={activeVideoUrl}
          autoPlay
          controls={false}
          playsInline
          preload="auto"
          onClick={handlePlayPause}
          onPlay={() => {
            setIsPlaying(true);
            recordHistoryOnce();
          }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            setVideoError('');
            handleLoadedMetadata();
          }}
          onError={handleVideoError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            visibility: videoError ? 'hidden' : 'visible',
          }}
        />
      )}

      {/* Back Button Overlay */}
      {showControls && (
        <div 
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: '600',
            zIndex: 100,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            transition: 'opacity 0.3s ease'
          }}
        >
          <ArrowLeft size={28} />
          <span>Back to Browse</span>
        </div>
      )}

      {/* Signature Netflix "Skip Intro" Overlay Button */}
      {showSkipIntro && (
        <button
          onClick={handleSkipIntroAction}
          style={{
            position: 'absolute',
            bottom: '120px',
            right: '40px',
            backgroundColor: 'rgba(20, 20, 20, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            padding: '12px 24px',
            cursor: 'pointer',
            zIndex: 110,
            letterSpacing: '1px',
            transition: 'all 0.2s',
            fontFamily: 'var(--font-display)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fff';
            e.currentTarget.style.color = '#000';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(20, 20, 20, 0.85)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Skip Intro
        </button>
      )}

      {/* Floating Controller overlay bar */}
      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
          padding: '40px 4% 30px 4%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 100,
          transition: 'opacity 0.3s ease'
        }}>
          {/* Progress Seek timeline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{
                flexGrow: 1,
                accentColor: 'var(--netflix-red)',
                cursor: 'pointer',
                height: '4px'
              }}
            />
            <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{formatTime(duration)}</span>
          </div>

          {/* Control Triggers */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
              {/* Play Pause */}
              <button 
                onClick={handlePlayPause}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} fill="#fff" />}
              </button>

              {/* Rewind */}
              <button 
                onClick={rewind}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <RotateCcw size={22} />
              </button>

              {/* Skip Forward */}
              <button 
                onClick={skipForward}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <SkipForward size={22} />
              </button>

              {/* Mute/Volume slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={toggleMute}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '80px',
                    accentColor: '#fff',
                    height: '3px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Title / Fullscreen */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#eee' }}>
                {movie?.title || 'Unknown Video'}
              </span>

              <button 
                onClick={handleFullscreen}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <Maximize2 size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const parseFallbackUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
};

const defaultSampleFallbackUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

export default Player;

