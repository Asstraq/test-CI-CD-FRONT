export const TRACK_SHARE_PREFIX = '[[soundbook-track-share]]';

export type TrackSharePayload = {
  type: 'track-share';
  spotifyId: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string | null;
  previewUrl?: string | null;
};

export function createTrackShareMessage(payload: TrackSharePayload) {
  return `${TRACK_SHARE_PREFIX}${JSON.stringify(payload)}`;
}

export function parseTrackShareMessage(
  content: string,
): TrackSharePayload | null {
  if (!content.startsWith(TRACK_SHARE_PREFIX)) return null;

  try {
    const parsed = JSON.parse(
      content.slice(TRACK_SHARE_PREFIX.length),
    ) as TrackSharePayload;

    if (
      parsed?.type !== 'track-share' ||
      !parsed.spotifyId?.trim() ||
      !parsed.title?.trim() ||
      !parsed.artist?.trim()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getMessageSnippet(content: string) {
  const sharedTrack = parseTrackShareMessage(content);
  if (!sharedTrack) return content;

  return `A partage un son : ${sharedTrack.title}`;
}
