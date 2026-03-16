export type FeedVisibility = 'PUBLIC' | 'FOLLOWERS';
export type FeedMediaKind = 'TRACK' | 'ALBUM' | 'ARTIST';

export type FeedUser = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
};

export type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  author: FeedUser;
};

export type SharedTrackContent = {
  kind: 'TRACK';
  spotifyId?: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
};

export type SharedAlbumContent = {
  kind: 'ALBUM';
  spotifyId?: string;
  title: string;
  artist: string;
  year?: number;
  imageUrl?: string;
};

export type SharedArtistContent = {
  kind: 'ARTIST';
  spotifyId?: string;
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
  reviewId?: number;
  authorId: string;
  visibility: FeedVisibility;
  content: string;
  createdAt: string;
  shared: FeedSharedContent;
  rating: number;
  likes: number;
  comments: number;
  likedByMe?: boolean;
  initialComments?: FeedComment[];
};

export type FeedEntry = {
  share: FeedShare;
  author: FeedUser;
};
