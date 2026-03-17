export type PlaylistVisibility = 'PUBLIC' | 'PRIVATE';

export type Track = {
  id: string;
  spotifyId?: string;
  name: string;
  album?: {
    id?: string;
    name?: string;
    image?: string | null;
  };
  artists?: Array<{ name: string }>;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  tracks?: Track[];
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
  ownerName?: string;
  ownerHandle?: string;
  visibility?: PlaylistVisibility;
};

export type CreatePlaylistRequest = {
  name: string;
  description?: string;
};

export type UpdatePlaylistRequest = {
  name?: string;
  description?: string;
  visibility?: PlaylistVisibility;
};

export type AddTrackToPlaylistRequest = {
  type: 'ALBUM' | 'TRACK';
  spotifyId: string;
  title: string;
  imageUrl?: string | null;
};
