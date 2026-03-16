import { api } from '@/lib/api/http';
import type {
  FeedComment,
  FeedEntry,
  FeedMediaKind,
  FeedShare,
  FeedSharedContent,
  FeedUser,
} from '@/type/feed';

type UnknownRecord = Record<string, unknown>;
type NormalizedFeedEntry = FeedEntry & {
  activityType: string;
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

function normalizeKind(value: unknown): FeedMediaKind {
  const raw = readString(value)?.toUpperCase();
  if (raw === 'ARTIST' || raw === 'ARTISTS') return 'ARTIST';
  if (raw === 'ALBUM' || raw === 'ALBUMS') return 'ALBUM';
  return 'TRACK';
}

function normalizeAuthor(
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedUser {
  const author =
    asRecord(item.author) ??
    asRecord(item.actor) ??
    asRecord(item.user) ??
    asRecord(item.owner) ??
    asRecord(review?.author) ??
    asRecord(review?.user);

  const id =
    readString(author?.id, author?.userId, item.authorId, item.userId) ??
    'unknown-author';
  const email = readString(author?.email) ?? '';
  const name =
    readString(author?.name, author?.nom, author?.username, author?.handle) ??
    'Utilisateur';
  const handleBase =
    readString(
      author?.handle,
      author?.username,
      author?.slug,
      author?.nom,
      author?.name,
    ) ?? name;

  return {
    id,
    email,
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(
        author?.avatarUrl,
        author?.avatar,
        author?.imageUrl,
        author?.photoUrl,
      ) ?? '',
  };
}

function normalizeCommentAuthor(item: UnknownRecord | null): FeedUser {
  const author =
    asRecord(item?.author) ??
    asRecord(item?.actor) ??
    asRecord(item?.user) ??
    asRecord(item?.owner);

  const name =
    readString(
      author?.name,
      author?.nom,
      author?.username,
      author?.handle,
      author?.email,
    ) ?? 'Utilisateur';
  const handleBase =
    readString(
      author?.handle,
      author?.username,
      author?.slug,
      author?.name,
      author?.nom,
    ) ?? name;

  return {
    id: readString(author?.id, author?.userId, author?.email) ?? 'unknown-user',
    email: readString(author?.email) ?? '',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    avatarUrl:
      readString(
        author?.avatarUrl,
        author?.avatar,
        author?.imageUrl,
        author?.photoUrl,
      ) ?? '',
  };
}

function normalizeComments(value: unknown): FeedComment[] {
  const entries = Array.isArray(value) ? value : asRecord(value) ? [value] : [];

  return entries
    .map((entry) => {
      const wrapper = asRecord(entry);
      const item =
        asRecord(wrapper?.comment) ??
        asRecord(wrapper?.data) ??
        asRecord(wrapper?.item) ??
        wrapper;
      if (!item) return null;

      return {
        id: readString(item.id, item.commentId) ?? `comment-${Date.now()}`,
        content: readString(item.content, item.text, item.body) ?? '',
        createdAt:
          readString(item.createdAt, item.created_at) ??
          new Date().toISOString(),
        author: normalizeCommentAuthor(item),
      };
    })
    .filter((comment): comment is FeedComment => Boolean(comment));
}

function mergeComments(lists: FeedComment[][]): FeedComment[] {
  const map = new Map<string, FeedComment>();

  for (const list of lists) {
    for (const comment of list) {
      const key = `${comment.id}-${comment.content}-${comment.createdAt}`;
      if (!map.has(key)) {
        map.set(key, comment);
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  );
}

function normalizeSharedContent(
  kind: FeedMediaKind,
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedSharedContent {
  const media =
    asRecord(item.media) ??
    asRecord(item.spotify) ??
    asRecord(item.item) ??
    asRecord(review?.media);

  const spotifyId = readString(
    item.spotifyId,
    item.mediaSpotifyId,
    media?.spotifyId,
    media?.id,
    review?.spotifyId,
  );
  const imageUrl = readString(
    media?.imageUrl,
    media?.image,
    media?.coverUrl,
    media?.photoUrl,
    item.imageUrl,
  );

  if (kind === 'ARTIST') {
    const genres =
      asArray(media?.genres).filter(
        (value): value is string => typeof value === 'string',
      ) || [];

    return {
      kind,
      spotifyId,
      name:
        readString(media?.name, item.title, item.name, review?.title) ??
        'Artiste inconnu',
      genres,
      imageUrl,
    };
  }

  if (kind === 'ALBUM') {
    return {
      kind,
      spotifyId,
      title:
        readString(media?.title, media?.name, item.title, review?.title) ??
        'Album inconnu',
      artist:
        readString(
          media?.artist,
          media?.artistName,
          media?.subtitle,
          item.artist,
          review?.artist,
        ) ?? 'Artiste inconnu',
      year: readNumber(
        media?.year,
        media?.releaseYear,
        item.year,
        review?.year,
      ),
      imageUrl,
    };
  }

  return {
    kind,
    spotifyId,
    title:
      readString(media?.title, media?.name, item.title, review?.title) ??
      'Titre inconnu',
    artist:
      readString(
        media?.artist,
        media?.artistName,
        item.artist,
        review?.artist,
      ) ?? 'Artiste inconnu',
    album: readString(
      media?.album,
      media?.albumName,
      item.album,
      review?.album,
    ),
    imageUrl,
  };
}

function getMediaKind(
  item: UnknownRecord,
  review: UnknownRecord | null,
): FeedMediaKind {
  const media =
    asRecord(item.media) ??
    asRecord(item.spotify) ??
    asRecord(item.item) ??
    asRecord(review?.media);

  return normalizeKind(
    media?.type ??
      item.mediaType ??
      review?.mediaType ??
      review?.type ??
      item.type,
  );
}

function normalizeFeedEntry(entry: unknown): NormalizedFeedEntry | null {
  const item = asRecord(entry);
  if (!item) return null;

  const review = asRecord(item.review);
  const activityType = readString(item.type)?.toUpperCase() ?? 'UNKNOWN';
  const kind = getMediaKind(item, review);
  const author = normalizeAuthor(item, review);
  const initialComments = normalizeComments(
    item.comment ??
      item.commentsList ??
      item.commentList ??
      item.comments ??
      review?.comment ??
      review?.commentsList ??
      review?.commentList ??
      review?.comments,
  );

  const share: FeedShare = {
    id: readString(item.id, review?.id) ?? `feed-${author.id}-${Date.now()}`,
    reviewId: readNumber(item.reviewId, review?.id),
    authorId: author.id,
    visibility:
      readString(item.visibility, review?.visibility)?.toUpperCase() ===
      'FOLLOWERS'
        ? 'FOLLOWERS'
        : 'PUBLIC',
    content:
      readString(item.content, review?.content, item.caption, item.text) ?? '',
    createdAt:
      readString(
        item.createdAt,
        item.created_at,
        review?.createdAt,
        review?.created_at,
      ) ?? new Date().toISOString(),
    shared: normalizeSharedContent(kind, item, review),
    rating: readNumber(item.rating, review?.rating) ?? 0,
    likes:
      readNumber(
        item.likes,
        item.likesCount,
        item.likeCount,
        review?.likes,
        review?.likesCount,
        review?.likeCount,
        asArray(item.likes).length,
        asArray(review?.likes).length,
      ) ?? 0,
    comments:
      readNumber(
        item.comments,
        item.commentsCount,
        item.commentCount,
        review?.comments,
        review?.commentsCount,
        review?.commentCount,
        asArray(item.commentList).length,
        asArray(review?.commentList).length,
        initialComments.length,
      ) ?? 0,
    likedByMe:
      item.likedByMe === true ||
      item.isLiked === true ||
      item.liked === true ||
      review?.likedByMe === true ||
      review?.isLiked === true ||
      review?.liked === true,
    initialComments,
  };

  return { share, author, activityType };
}

function getActivityBoost(entries: NormalizedFeedEntry[], pattern: RegExp) {
  return entries.filter((entry) => pattern.test(entry.activityType)).length;
}

export async function getFeed(): Promise<FeedEntry[]> {
  const response = await api<unknown>('/feed');
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.activities).length > 0
      ? asArray(root?.activities)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.feed).length > 0
          ? asArray(root?.feed)
          : asArray(root?.data);

  const grouped = items
    .map(normalizeFeedEntry)
    .filter((entry): entry is NormalizedFeedEntry => Boolean(entry))
    .reduce<Map<number, NormalizedFeedEntry[]>>((acc, entry) => {
      if (typeof entry.share.reviewId !== 'number') return acc;
      const current = acc.get(entry.share.reviewId) ?? [];
      current.push(entry);
      acc.set(entry.share.reviewId, current);
      return acc;
    }, new Map());

  return [...grouped.values()]
    .map((entries) => {
      const baseEntry =
        entries.find((entry) => entry.activityType === 'REVIEW_CREATED') ??
        null;
      if (!baseEntry) return null;

      const boostedLikes =
        baseEntry.share.likes + getActivityBoost(entries, /LIKE/);
      const boostedComments =
        Math.max(
          baseEntry.share.comments,
          mergeComments(
            entries.map((entry) => entry.share.initialComments ?? []),
          ).length,
        ) + getActivityBoost(entries, /COMMENT/);
      const mergedComments = mergeComments(
        entries.map((entry) => entry.share.initialComments ?? []),
      );

      return {
        ...baseEntry,
        share: {
          ...baseEntry.share,
          likes: boostedLikes,
          comments: Math.max(boostedComments, mergedComments.length),
          initialComments: mergedComments,
        },
      };
    })
    .filter((entry): entry is FeedEntry => Boolean(entry))
    .sort((a, b) => {
      const scoreA = a.share.likes + a.share.comments * 2;
      const scoreB = b.share.likes + b.share.comments * 2;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return +new Date(b.share.createdAt) - +new Date(a.share.createdAt);
    });
}
