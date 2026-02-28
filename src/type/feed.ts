export type FeedVisibility = 'PUBLIC' | 'FOLLOWERS';

export type FeedUser = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
};

export type SharedTrackContent = {
  kind: 'TRACK';
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
};

export type SharedAlbumContent = {
  kind: 'ALBUM';
  title: string;
  artist: string;
  year?: number;
  imageUrl?: string;
};

export type SharedArtistContent = {
  kind: 'ARTIST';
  name: string;
  genres?: string[];
  imageUrl?: string;
};

export type FeedSharedContent =
  | SharedTrackContent
  | SharedAlbumContent
  | SharedArtistContent;

export type FeedShare = {
  id: string;
  authorId: string;
  visibility: FeedVisibility;
  content: string;
  createdAt: string;
  shared: FeedSharedContent;
  rating: number;
  likes: number;
  comments: number;
};
