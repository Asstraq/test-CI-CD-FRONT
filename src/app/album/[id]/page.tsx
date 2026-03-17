import AlbumTracks from '@/app/album/[id]/AlbumTracks';
import BackToHomeButton from '@/components/BackToHomeButton';
import { BACKEND_URL } from '@/lib/config';
import {
  Box,
  Container,
  Divider,
  Paper,
  Rating,
  Stack,
  Typography,
} from '@mui/material';

type AlbumArtist = {
  id?: string;
  name: string;
};

type AlbumTrack = {
  id?: string;
  name: string;
};

type AlbumDetail = {
  id: string;
  name: string;
  releaseDate?: string;
  image?: string | null;
  artists?: AlbumArtist[];
  tracks?: AlbumTrack[];
  avgRating?: number;
  ratingsCount?: number;
};

type MediaAlbumResponse = {
  media?: {
    spotifyId?: string;
    title?: string;
    imageUrl?: string | null;
  };
  spotify?: {
    id?: string;
    name?: string;
    releaseDate?: string;
    image?: string | null;
    artists?: AlbumArtist[];
    tracks?: AlbumTrack[];
  };
  community?: {
    avgRating?: number;
    ratingsCount?: number;
  };
};

type AlbumFetchResult = {
  album: AlbumDetail | null;
  error: string | null;
};

async function getAlbum(id: string): Promise<AlbumFetchResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/media/ALBUM/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { album: null, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as MediaAlbumResponse;
    const album = {
      id: data.spotify?.id ?? data.media?.spotifyId ?? id,
      name: data.spotify?.name ?? data.media?.title ?? 'Album inconnu',
      releaseDate: data.spotify?.releaseDate,
      image: data.spotify?.image ?? data.media?.imageUrl ?? null,
      artists: data.spotify?.artists ?? [],
      tracks: data.spotify?.tracks ?? [],
      avgRating: data.community?.avgRating,
      ratingsCount: data.community?.ratingsCount ?? 0,
    };
    return { album, error: null };
  } catch (err) {
    return {
      album: null,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { album, error } = await getAlbum(id);
  const artists = album?.artists?.map((artist) => artist.name).join(', ');
  const avgRating = album?.avgRating ?? 0;
  const ratingsCount = album?.ratingsCount ?? 0;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f4f4f0 0%, #e9efff 100%)',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="md">
        <BackToHomeButton />
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.7)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {album ? (
            <Stack spacing={4}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                <Box
                  component="img"
                  src={album.image ?? '/images/album-placeholder.jpg'}
                  alt={album.name}
                  sx={{
                    width: { xs: '100%', sm: 180 },
                    height: { xs: 'auto', sm: 180 },
                    borderRadius: 3,
                    objectFit: 'cover',
                    backgroundColor: '#e5e7eb',
                  }}
                />
                <Box>
                  <Typography variant="overline" sx={{ color: '#5a6b7a' }}>
                    Album
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {album.name}
                  </Typography>
                  <Typography sx={{ color: '#4a5568', mt: 1 }}>
                    {artists || 'Artiste inconnu'}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    sx={{ mt: 1.5 }}
                  >
                    <Rating
                      value={avgRating}
                      precision={0.1}
                      readOnly
                      size="small"
                    />
                    <Typography sx={{ color: '#1a1d24', fontWeight: 600 }}>
                      {ratingsCount > 0 ? avgRating.toFixed(1) : 'Aucune note'}
                    </Typography>
                    <Typography sx={{ color: '#64748b' }}>
                      {ratingsCount > 0
                        ? `(${ratingsCount} vote${ratingsCount > 1 ? 's' : ''})`
                        : '(0 vote)'}
                    </Typography>
                  </Stack>
                  {album.releaseDate ? (
                    <Typography sx={{ color: '#64748b', mt: 1 }}>
                      Sortie : {album.releaseDate}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>

              {album.tracks?.length ? (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Titres
                    </Typography>
                    <AlbumTracks tracks={album.tracks} album={album} />
                  </Box>
                </>
              ) : null}
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Album indisponible
              </Typography>
              <Typography sx={{ color: '#4a5568' }}>
                {error || 'Impossible de charger cet album pour le moment.'}
              </Typography>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
