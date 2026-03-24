'use client';

import {
  getTrackPreviews,
  type TrackPreviewResult,
} from '@/lib/api/spotify.api';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import { Avatar, Box, CircularProgress, IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

type TrackPreviewArtworkProps = {
  trackId?: string | null;
  imageUrl?: string | null;
  alt: string;
  size?: number;
  variant?: 'rounded' | 'circular';
};

const previewCache = new Map<string, TrackPreviewResult | null>();
const pendingPreviewRequests = new Map<
  string,
  Promise<TrackPreviewResult | null>
>();

let activePlayback: {
  trackId: string;
  stop: () => void;
} | null = null;

async function loadTrackPreview(trackId: string) {
  if (previewCache.has(trackId)) {
    return previewCache.get(trackId) ?? null;
  }

  const existingRequest = pendingPreviewRequests.get(trackId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = getTrackPreviews([trackId])
    .then((tracks) => {
      const result =
        tracks.find((track) => track.spotifyId === trackId) ?? null;
      previewCache.set(trackId, result);
      pendingPreviewRequests.delete(trackId);
      return result;
    })
    .catch((error) => {
      pendingPreviewRequests.delete(trackId);
      throw error;
    });

  pendingPreviewRequests.set(trackId, request);
  return request;
}

export default function TrackPreviewArtwork({
  trackId,
  imageUrl,
  alt,
  size = 56,
  variant = 'rounded',
}: TrackPreviewArtworkProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    if (!trackId) return null;
    return previewCache.get(trackId)?.previewUrl ?? null;
  });
  const [resolved, setResolved] = useState(() =>
    trackId ? previewCache.has(trackId) : true,
  );
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const releaseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.onended = null;
    audio.onpause = null;
    audioRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);

    if (trackId && activePlayback?.trackId === trackId) {
      activePlayback = null;
    }
  }, [trackId]);

  const ensurePreview = useCallback(async () => {
    if (!trackId) return null;

    if (previewCache.has(trackId)) {
      const cached = previewCache.get(trackId) ?? null;
      setResolved(true);
      setPreviewUrl(cached?.previewUrl ?? null);
      return cached?.previewUrl ?? null;
    }

    setLoading(true);

    try {
      const preview = await loadTrackPreview(trackId);
      setResolved(true);
      setPreviewUrl(preview?.previewUrl ?? null);
      return preview?.previewUrl ?? null;
    } catch {
      setResolved(true);
      setPreviewUrl(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  const handleTogglePlayback = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!trackId || loading) return;

      if (playing) {
        stopPlayback();
        return;
      }

      const url = previewUrl ?? (await ensurePreview());
      if (!url) return;

      if (activePlayback && activePlayback.trackId !== trackId) {
        activePlayback.stop();
      }

      let audio = audioRef.current;

      if (!audio || audio.src !== url) {
        releaseAudio();
        audio = new Audio(url);
        audio.preload = 'none';
        audio.onended = () => {
          setPlaying(false);
          if (activePlayback?.trackId === trackId) {
            activePlayback = null;
          }
        };
        audio.onpause = () => {
          setPlaying(false);
        };
        audioRef.current = audio;
      }

      try {
        await audio.play();
        setPlaying(true);
        activePlayback = {
          trackId,
          stop: stopPlayback,
        };
      } catch {
        setPlaying(false);
      }
    },
    [
      ensurePreview,
      loading,
      playing,
      previewUrl,
      releaseAudio,
      stopPlayback,
      trackId,
    ],
  );

  useEffect(() => {
    setPreviewUrl(
      trackId ? (previewCache.get(trackId)?.previewUrl ?? null) : null,
    );
    setResolved(trackId ? previewCache.has(trackId) : true);
    setLoading(false);
    setPlaying(false);
    releaseAudio();
  }, [releaseAudio, trackId]);

  useEffect(() => {
    return () => {
      if (trackId && activePlayback?.trackId === trackId) {
        activePlayback = null;
      }
      releaseAudio();
    };
  }, [releaseAudio, trackId]);

  const hasPreviewControl = Boolean(trackId);
  const isUnavailable = resolved && !previewUrl && !loading;
  const borderRadius = variant === 'rounded' ? 3 : '50%';

  return (
    <Box
      onMouseEnter={() => {
        if (!loading && !resolved && trackId) {
          void ensurePreview();
        }
      }}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        '& .track-preview-overlay': {
          opacity: 1,
          transition: 'opacity 140ms ease',
        },
        '@media (hover: hover) and (pointer: fine)': {
          '& .track-preview-overlay': {
            opacity: playing || loading ? 1 : 0,
          },
          '&:hover .track-preview-overlay': {
            opacity: 1,
          },
        },
      }}
    >
      <Avatar
        variant={variant}
        src={imageUrl || undefined}
        alt={alt}
        sx={{
          width: size,
          height: size,
          borderRadius,
          bgcolor: '#dbe4f0',
        }}
      />

      {hasPreviewControl ? (
        <Box
          className="track-preview-overlay"
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.72) 100%)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <IconButton
            size="small"
            onClick={handleTogglePlayback}
            disabled={isUnavailable}
            sx={{
              width: Math.max(32, Math.round(size * 0.55)),
              height: Math.max(32, Math.round(size * 0.55)),
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: '#fff',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.28)',
              },
              '&.Mui-disabled': {
                color: 'rgba(255,255,255,0.8)',
                backgroundColor: 'rgba(15,23,42,0.2)',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={18} sx={{ color: '#fff' }} />
            ) : isUnavailable ? (
              <VolumeOffRoundedIcon fontSize="small" />
            ) : playing ? (
              <PauseRoundedIcon fontSize="small" />
            ) : (
              <PlayArrowRoundedIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}
