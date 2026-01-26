'use client';

import { BACKEND_URL } from '@/lib/config';
import { useAuth } from '@/hooks/useAuth';
import LikeButton from '@/components/LikeButton';
import type { AddTrackToPlaylistRequest } from '@/type/playlist';
import {
  Avatar,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Track = {
  id: string;
  name: string;
  album?: { id?: string; name?: string; image?: string | null };
  artists?: Array<{ name: string }>;
};

type SearchResponse = {
  tracks?: Track[];
};

type SearchState = {
  loading: boolean;
  error: string | null;
  results: Track[];
};

function getPrimaryText(track: Track) {
  return track.name || 'Titre inconnu';
}

function getSecondaryText(track: Track) {
  const artistNames = track.artists?.map((artist) => artist.name).join(', ');
  const albumName = track.album?.name;
  if (artistNames && albumName) return `${artistNames} · ${albumName}`;
  return artistNames || albumName || '';
}

export default function SearchInput() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({
    loading: false,
    error: null,
    results: [],
  });

  const createTrackData = (track: Track): AddTrackToPlaylistRequest => ({
    type: 'TRACK',
    spotifyId: track.id ?? '',
    title: track.name,
    imageUrl: track.album?.image ?? null,
  });

  useEffect(() => {
    if (!query.trim()) {
      setState({ loading: false, error: null, results: [] });
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams({ q: query, limit: '5' });
        const res = await fetch(
          `${BACKEND_URL}/spotify/search?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as SearchResponse;
        const results = data.tracks?.slice(0, 5) ?? [];
        setState({ loading: false, error: null, results });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
          results: [],
        });
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <Box sx={{ maxWidth: 520 }}>
      <TextField
        fullWidth
        label="Rechercher un son"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Daft Punk, Eminem, Orelsan..."
        InputProps={{
          endAdornment: state.loading ? <CircularProgress size={18} /> : null,
        }}
      />
      {state.results.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          {state.error ? (
            <Box sx={{ p: 2 }}>
              <Typography color="error">{state.error}</Typography>
            </Box>
          ) : null}
          <List>
            {state.results.map((track, index) => {
              const albumId = track.album?.id;
              const albumHref = albumId ? `/album/${albumId}` : undefined;
              return (
                <ListItem
                  key={track.id ?? `${getPrimaryText(track)}-${index}`}
                  secondaryAction={
                    user && track.id ? (
                      <LikeButton track={createTrackData(track)} size="small" />
                    ) : null
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={track.album?.image ?? undefined}
                      alt={track.album?.name || track.name}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      albumHref ? (
                        <MuiLink
                          component={Link}
                          href={albumHref}
                          underline="hover"
                          color="inherit"
                          fontWeight={600}
                        >
                          {getPrimaryText(track)}
                        </MuiLink>
                      ) : (
                        getPrimaryText(track)
                      )
                    }
                    secondary={
                      albumHref ? (
                        <Typography variant="body2" color="text.secondary">
                          <MuiLink
                            component={Link}
                            href={albumHref}
                            underline="hover"
                            color="inherit"
                          >
                            {getSecondaryText(track)}
                          </MuiLink>
                        </Typography>
                      ) : (
                        getSecondaryText(track)
                      )
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
