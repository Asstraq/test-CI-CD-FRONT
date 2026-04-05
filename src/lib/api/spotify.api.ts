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

export type TrackPreviewResult = {
  spotifyId: string;
  title: string;
  previewUrl: string | null;
  previewSource: string | null;
  available: boolean;
  imageUrl?: string;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

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

function normalizeTrackPreview(entry: unknown): TrackPreviewResult | null {
  const item = asRecord(entry);
  const spotifyId = readString(item?.spotifyId, item?.id);
  if (!spotifyId) return null;

  const album = asRecord(item?.album);

  return {
    spotifyId,
    title: readString(item?.title, item?.name) ?? 'Titre inconnu',
    previewUrl: readString(item?.previewUrl) ?? null,
    previewSource: readString(item?.previewSource) ?? null,
    available:
      Boolean(item?.available) && Boolean(readString(item?.previewUrl)),
    imageUrl: readString(
      item?.imageUrl,
      item?.image,
      album?.image,
      readImage(album?.images),
    ),
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

function scoreSearchResult(query: string, result: MediaSearchResult): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchText(result.title);
  const subtitle = normalizeSearchText(result.subtitle);
  const titleWords = title.split(/\s+/).filter(Boolean);
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  let score = 0;

  if (title === normalizedQuery) score += 1_000;
  if (title.startsWith(normalizedQuery)) score += 700;
  if (title.includes(normalizedQuery)) score += 450;
  if (subtitle.includes(normalizedQuery)) score += 180;

  queryWords.forEach((word) => {
    if (titleWords.some((titleWord) => titleWord.startsWith(word))) {
      score += 90;
    } else if (title.includes(word)) {
      score += 50;
    }

    if (subtitle.includes(word)) {
      score += 20;
    }
  });

  return score;
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

export async function searchSpotifyCatalog(
  query: string,
  limitPerKind = 4,
): Promise<MediaSearchResult[]> {
  const [tracks, albums, artists] = await Promise.all([
    searchSpotifyMedia(query, 'TRACK', limitPerKind),
    searchSpotifyMedia(query, 'ALBUM', limitPerKind),
    searchSpotifyMedia(query, 'ARTIST', limitPerKind),
  ]);

  return [...tracks, ...albums, ...artists]
    .sort((left, right) => {
      const scoreDiff =
        scoreSearchResult(query, right) - scoreSearchResult(query, left);
      if (scoreDiff !== 0) return scoreDiff;

      const titleLengthDiff = left.title.length - right.title.length;
      if (titleLengthDiff !== 0) return titleLengthDiff;

      return left.title.localeCompare(right.title);
    })
    .slice(0, 6);
}

export async function getTrackPreviews(
  spotifyIds: string[],
): Promise<TrackPreviewResult[]> {
  const ids = [...new Set(spotifyIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    ids: ids.join(','),
  });

  const response = await api<unknown>(
    `/spotify/tracks/previews?${params.toString()}`,
    {
      auth: false,
    },
  );

  const root = asRecord(response);
  const items = asArray(root?.tracks);

  return items
    .map(normalizeTrackPreview)
    .filter((entry): entry is TrackPreviewResult => Boolean(entry));
}
