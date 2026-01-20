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
  return api<Playlist>(`/lists/${id}`, {
    method: 'GET',
  });
}

export function addTrackToPlaylist(
  playlistId: string,
  track: AddTrackToPlaylistRequest,
) {
  return api<Playlist>(`/lists/${playlistId}/tracks`, {
    method: 'POST',
    body: track,
  });
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  return api<Playlist>(`/lists/${playlistId}/tracks/${trackId}`, {
    method: 'DELETE',
  });
}
