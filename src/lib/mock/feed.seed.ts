import type { SessionUser } from '@/lib/auth/userSession';
import type { FeedShare, FeedUser } from '@/type/feed';

type FollowRelation = {
  followerId: string;
  followedId: string;
};

const seededUsers: FeedUser[] = [
  {
    id: 'u-1',
    email: 'sarah@soundbook.dev',
    name: 'Sarah Martin',
    handle: '@sarahvibes',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  },
  {
    id: 'u-2',
    email: 'leo@soundbook.dev',
    name: 'Leo Dupont',
    handle: '@leo.deepcuts',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop',
  },
  {
    id: 'u-3',
    email: 'maya@soundbook.dev',
    name: 'Maya Rossi',
    handle: '@mayawaves',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80&auto=format&fit=crop',
  },
  {
    id: 'u-4',
    email: 'tom@soundbook.dev',
    name: 'Tom Bernard',
    handle: '@tomvinyl',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  },
  {
    id: 'u-5',
    email: 'jolan@soundbook.dev',
    name: 'Jolan Poussier',
    handle: '@jolan',
    avatarUrl:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&q=80&auto=format&fit=crop',
  },
];

const seededFollows: FollowRelation[] = [
  { followerId: 'u-5', followedId: 'u-1' },
  { followerId: 'u-5', followedId: 'u-3' },
  { followerId: 'viewer-seed', followedId: 'u-1' },
  { followerId: 'viewer-seed', followedId: 'u-3' },
  { followerId: 'u-3', followedId: 'u-2' },
  { followerId: 'u-1', followedId: 'u-4' },
  { followerId: 'u-2', followedId: 'u-1' },
];

const seededShares: FeedShare[] = [
  {
    id: 's-101',
    authorId: 'u-1',
    visibility: 'PUBLIC',
    content: 'Je tourne en boucle dessus ce matin, la prod est incroyable.',
    createdAt: '2026-02-27T21:35:00.000Z',
    shared: {
      kind: 'TRACK',
      title: 'Midnight City',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      imageUrl:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=240&q=80&auto=format&fit=crop',
    },
    rating: 5,
    likes: 24,
    comments: 6,
  },
  {
    id: 's-102',
    authorId: 'u-2',
    visibility: 'FOLLOWERS',
    content: 'Petit son pour bosser tard, ambiance parfaite.',
    createdAt: '2026-02-27T19:20:00.000Z',
    shared: {
      kind: 'TRACK',
      title: 'Nights',
      artist: 'Frank Ocean',
      album: 'Blonde',
      imageUrl:
        'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=240&q=80&auto=format&fit=crop',
    },
    rating: 4,
    likes: 12,
    comments: 2,
  },
  {
    id: 's-103',
    authorId: 'u-3',
    visibility: 'PUBLIC',
    content: 'Un album complet, zero skip pour moi.',
    createdAt: '2026-02-27T17:05:00.000Z',
    shared: {
      kind: 'ALBUM',
      title: 'Currents',
      artist: 'Tame Impala',
      year: 2015,
      imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=240&q=80&auto=format&fit=crop',
    },
    rating: 5,
    likes: 33,
    comments: 9,
  },
  {
    id: 's-104',
    authorId: 'u-4',
    visibility: 'PUBLIC',
    content: 'Je recommande cet artiste si vous aimez les sets chill.',
    createdAt: '2026-02-26T23:42:00.000Z',
    shared: {
      kind: 'ARTIST',
      name: 'FKJ',
      genres: ['Nu Jazz', 'Electro Soul'],
      imageUrl:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=240&q=80&auto=format&fit=crop',
    },
    rating: 4,
    likes: 17,
    comments: 4,
  },
  {
    id: 's-105',
    authorId: 'u-3',
    visibility: 'FOLLOWERS',
    content: 'Ce live est fou, guitare + voix au top.',
    createdAt: '2026-02-26T18:08:00.000Z',
    shared: {
      kind: 'TRACK',
      title: 'Gravity (Live)',
      artist: 'John Mayer',
      album: 'Where the Light Is',
      imageUrl:
        'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=240&q=80&auto=format&fit=crop',
    },
    rating: 5,
    likes: 20,
    comments: 5,
  },
];

function getCurrentUserId(sessionUser: SessionUser | null): string | null {
  if (!sessionUser?.user) return null;

  if (sessionUser.user.id) {
    const byId = seededUsers.find((entry) => entry.id === sessionUser.user.id);
    if (byId) return byId.id;
  }

  const byEmail = seededUsers.find(
    (entry) =>
      entry.email.toLowerCase() === sessionUser.user.email.toLowerCase(),
  );

  return byEmail?.id ?? 'viewer-seed';
}

export function getSeededUsers(): FeedUser[] {
  return seededUsers;
}

export function getSeededFollowedUsers(
  sessionUser: SessionUser | null,
): FeedUser[] {
  const currentUserId = getCurrentUserId(sessionUser);
  if (!currentUserId) return [];

  const followedIds = new Set(
    seededFollows
      .filter((follow) => follow.followerId === currentUserId)
      .map((follow) => follow.followedId),
  );

  return seededUsers.filter((user) => followedIds.has(user.id));
}

export function getSeededFeed(sessionUser: SessionUser | null): FeedShare[] {
  const currentUserId = getCurrentUserId(sessionUser);

  if (!currentUserId) {
    return seededShares
      .filter((share) => share.visibility === 'PUBLIC')
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  const followedIds = new Set(
    seededFollows
      .filter((follow) => follow.followerId === currentUserId)
      .map((follow) => follow.followedId),
  );

  return seededShares
    .filter((share) => {
      if (share.visibility === 'PUBLIC') return true;
      return followedIds.has(share.authorId);
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getAuthorById(authorId: string): FeedUser | undefined {
  return seededUsers.find((user) => user.id === authorId);
}
