import { api } from '@/lib/api/http';
import type { FeedMediaKind } from '@/type/feed';

type UnknownRecord = Record<string, unknown>;

export type MediaSearchResult = {
  spotifyId: string;
  kind: FeedMediaKind;
  title: string;
  subtitle: string;
  imageUrl?: string;
  artist?: string;
  album?: string;
  year?: number;
  genres?: string[];
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readArtists(value: unknown): string | undefined {
  const artists = asArray(value)
    .map((entry) => asRecord(entry))
    .map((entry) => readString(entry?.name))
    .filter((entry): entry is string => Boolean(entry));

  return artists.length > 0 ? artists.join(', ') : undefined;
}

function readImage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  const record = asRecord(value);
  if (record) {
    return readString(record.url, record.image, record.imageUrl);
  }

  const first = asArray(value)
    .map((entry) => asRecord(entry))
    .find(Boolean);

  return first ? readString(first.url, first.image, first.imageUrl) : undefined;
}

function extractItems(response: unknown, kind: FeedMediaKind): unknown[] {
  const root = asRecord(response);
  if (Array.isArray(response)) return response;

  if (kind === 'TRACK') {
    const tracks = root?.tracks;
    return Array.isArray(tracks) ? tracks : asArray(asRecord(tracks)?.items);
  }

  if (kind === 'ALBUM') {
    const albums = root?.albums;
    return Array.isArray(albums) ? albums : asArray(asRecord(albums)?.items);
  }

  const artists = root?.artists;
  return Array.isArray(artists) ? artists : asArray(asRecord(artists)?.items);
}

function normalizeTrack(entry: unknown): MediaSearchResult | null {
  const item = asRecord(entry);
  const spotifyId = readString(item?.spotifyId, item?.id);
  if (!spotifyId) return null;

  const artist = readString(
    item?.artist,
    item?.artistName,
    readArtists(item?.artists),
  );
  const albumRecord = asRecord(item?.album);
  const album = readString(item?.album, albumRecord?.name);

  return {
    spotifyId,
    kind: 'TRACK',
    title: readString(item?.title, item?.name) ?? 'Titre inconnu',
    subtitle: [artist, album].filter(Boolean).join(' · '),
    imageUrl: readString(
      item?.imageUrl,
      item?.image,
      readImage(albumRecord?.images),
      albumRecord?.image,
    ),
    artist,
    album,
  };
}

function normalizeAlbum(entry: unknown): MediaSearchResult | null {
  const item = asRecord(entry);
  const spotifyId = readString(item?.spotifyId, item?.id);
  if (!spotifyId) return null;

  const artist = readString(
    item?.artist,
    item?.artistName,
    readArtists(item?.artists),
  );
  const year = readNumber(
    item?.year,
    item?.releaseYear,
    item?.release_date?.toString().slice(0, 4),
  );

  return {
    spotifyId,
    kind: 'ALBUM',
    title: readString(item?.title, item?.name) ?? 'Album inconnu',
    subtitle: [artist, year?.toString()].filter(Boolean).join(' · '),
    imageUrl: readString(item?.imageUrl, item?.image, readImage(item?.images)),
    artist,
    year,
  };
}

function normalizeArtist(entry: unknown): MediaSearchResult | null {
  const item = asRecord(entry);
  const spotifyId = readString(item?.spotifyId, item?.id);
  if (!spotifyId) return null;

  const genres = asArray(item?.genres).filter(
    (value): value is string =>
      typeof value === 'string' && Boolean(value.trim()),
  );

  return {
    spotifyId,
    kind: 'ARTIST',
    title: readString(item?.title, item?.name) ?? 'Artiste inconnu',
    subtitle: genres.join(' · '),
    imageUrl: readString(item?.imageUrl, item?.image, readImage(item?.images)),
    genres,
  };
}

export async function searchSpotifyMedia(
  query: string,
  kind: FeedMediaKind,
  limit = 6,
): Promise<MediaSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    type: kind.toLowerCase(),
    limit: String(limit),
  });

  const response = await api<unknown>(`/spotify/search?${params.toString()}`, {
    auth: false,
  });

  const items = extractItems(response, kind);

  const normalize =
    kind === 'TRACK'
      ? normalizeTrack
      : kind === 'ALBUM'
        ? normalizeAlbum
        : normalizeArtist;

  return items
    .map(normalize)
    .filter((entry): entry is MediaSearchResult => Boolean(entry));
}
