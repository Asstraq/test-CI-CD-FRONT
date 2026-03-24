'use client';

import SharedTrackMessageCard from '@/components/messaging/SharedTrackMessageCard';
import { parseTrackShareMessage } from '@/lib/messages/track-share';
import { Typography } from '@mui/material';

type MessageBodyProps = {
  content: string;
  isMine: boolean;
};

export default function MessageBody({ content, isMine }: MessageBodyProps) {
  const sharedTrack = parseTrackShareMessage(content);

  if (sharedTrack) {
    return <SharedTrackMessageCard payload={sharedTrack} isMine={isMine} />;
  }

  return <Typography variant="body2">{content}</Typography>;
}
