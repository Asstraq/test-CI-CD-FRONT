import { api } from '@/lib/api/http';
import type {
  AddTrackToPlaylistRequest,
  CreatePlaylistRequest,
  Playlist,
  Track,
  UpdatePlaylistRequest,
} from '@/type/playlist';

type PlaylistsResponse = {
  lists: Playlist[];
};

type UnknownRecord = Record<string, unknown>;

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

function readId(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

function normalizeVisibility(...values: unknown[]): Playlist['visibility'] {
  for (const value of values) {
    if (value === 'PUBLIC' || value === 'PRIVATE') return value;
    if (value === true) return 'PUBLIC';
    if (value === false) return 'PRIVATE';
    if (typeof value === 'string' && value.trim()) {
      const normalized = value.trim().toUpperCase();
      if (normalized === 'PUBLIC') return 'PUBLIC';
      if (normalized === 'PRIVATE') return 'PRIVATE';
    }
  }

  return undefined;
}

function normalizeTrack(entry: unknown): Track | null {
  const item = asRecord(entry);
  if (!item) return null;

  const album = asRecord(item.album);
  const artists = asArray(item.artists)
    .map((artist) => asRecord(artist))
    .filter((artist): artist is UnknownRecord => Boolean(artist))
    .map((artist) => ({ name: readString(artist.name) ?? 'Artiste inconnu' }));

  return {
    id: readId(item.id, item.spotifyId) ?? '',
    spotifyId: readString(item.spotifyId),
    name: readString(item.name, item.title) ?? 'Titre inconnu',
    album: album
      ? {
          id: readId(album.id),
          name: readString(album.name, album.title),
          image:
            readString(album.image, album.imageUrl, album.coverUrl) ?? null,
        }
      : undefined,
    artists,
  };
}

function normalizePlaylist(entry: unknown): Playlist | null {
  const source = asRecord(entry);
  if (!source) return null;

  const item = asRecord(source.list) ?? source;

  const owner =
    asRecord(item.owner) ?? asRecord(item.user) ?? asRecord(item.author);

  return {
    id: readId(item.id, item.listId) ?? '',
    name: readString(item.name, item.title) ?? 'Playlist',
    description: readString(item.description, item.desc),
    createdAt: readString(item.createdAt, item.created_at),
    updatedAt: readString(item.updatedAt, item.updated_at),
    ownerId: readId(
      item.ownerId,
      item.userId,
      item.authorId,
      owner?.id,
      owner?.userId,
    ),
    ownerName: readString(owner?.name, owner?.nom, owner?.username),
    ownerHandle: readString(owner?.handle, owner?.username, owner?.slug),
    visibility: normalizeVisibility(
      item.visibility,
      item.isPublic,
      item.public,
      item.is_private === true ? 'PRIVATE' : undefined,
    ),
    tracks: asArray(item.tracks)
      .map(normalizeTrack)
      .filter((track): track is Track => Boolean(track?.id)),
  };
}

function normalizePlaylistsResponse(response: unknown): Playlist[] {
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.lists).length > 0
      ? asArray(root?.lists)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.data).length > 0
          ? asArray(root?.data)
          : asArray(root?.results);

  return items
    .map(normalizePlaylist)
    .filter((playlist): playlist is Playlist => Boolean(playlist?.id));
}

export async function createPlaylist(data: CreatePlaylistRequest) {
  const response = await api<unknown>('/lists', {
    method: 'POST',
    body: data,
  });
  return normalizePlaylist(response) ?? { id: '', name: data.name };
}

export async function getUserPlaylists(): Promise<PlaylistsResponse> {
  const response = await api<unknown>('/lists', {
    method: 'GET',
  });
  return { lists: normalizePlaylistsResponse(response) };
}

export async function getPlaylistById(id: string): Promise<Playlist> {
  const response = await api<unknown>(`/public/lists/${id}`, {
    method: 'GET',
    auth: false,
  });
  return normalizePlaylist(response) ?? { id, name: 'Playlist' };
}

export async function searchPublicLists(query: string): Promise<Playlist[]> {
  const attempts = [
    `/search/lists?q=${encodeURIComponent(query)}`,
    `/search/lists?query=${encodeURIComponent(query)}`,
  ];

  let lastError: unknown;

  for (const path of attempts) {
    try {
      const response = await api<unknown>(path, { auth: false });
      return normalizePlaylistsResponse(response);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Recherche de playlists impossible.');
}

export async function updatePlaylist(
  playlistId: string,
  data: UpdatePlaylistRequest,
): Promise<Playlist> {
  const body: { name?: string; isPublic?: boolean } = {};

  if (data.name) {
    body.name = data.name;
  }

  if (data.visibility) {
    body.isPublic = data.visibility === 'PUBLIC';
  }

  const response = await api<unknown>(`/lists/${playlistId}`, {
    method: 'PATCH',
    body,
  });

  return normalizePlaylist(response) ?? { id: playlistId, name: 'Playlist' };
}

export function addTrackToPlaylist(
  playlistId: string,
  track: AddTrackToPlaylistRequest,
) {
  return api<Playlist>(`/lists/${playlistId}/items`, {
    method: 'POST',
    body: track,
  });
}

export function removeTrackFromPlaylist(
  playlistId: string,
  type: 'ALBUM' | 'TRACK',
  spotifyId: string,
) {
  return api<Playlist>(`/lists/${playlistId}/items/${type}/${spotifyId}`, {
    method: 'DELETE',
  });
}
