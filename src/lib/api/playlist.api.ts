import { api } from '@/lib/api/http';
import type {
  AddTrackToPlaylistRequest,
  CreatePlaylistRequest,
  Playlist,
} from '@/type/playlist';

type PlaylistsResponse = {
  lists: Playlist[];
};

export function createPlaylist(data: CreatePlaylistRequest) {
  return api<Playlist>('/lists', {
    method: 'POST',
    body: data,
  });
}

export function getUserPlaylists() {
  return api<PlaylistsResponse>('/lists', {
    method: 'GET',
  });
}

export function getPlaylistById(id: string) {
  return api<Playlist>(`/public/lists/${id}`, {
    method: 'GET',
    auth: false,
  });
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
