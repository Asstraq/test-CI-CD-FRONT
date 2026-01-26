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
};

export type CreatePlaylistRequest = {
  name: string;
  description?: string;
};

export type AddTrackToPlaylistRequest = {
  type: 'ALBUM' | 'TRACK';
  spotifyId: string;
  title: string;
  imageUrl?: string | null;
};
