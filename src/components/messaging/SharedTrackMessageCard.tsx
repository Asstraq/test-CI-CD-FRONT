'use client';

import type { TrackSharePayload } from '@/lib/messages/track-share';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import { Avatar, Box, Chip, Paper, Stack, Typography } from '@mui/material';

type SharedTrackMessageCardProps = {
  payload: TrackSharePayload;
  isMine: boolean;
};

export default function SharedTrackMessageCard({
  payload,
  isMine,
}: SharedTrackMessageCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 0.75,
        p: 1.25,
        borderRadius: 2,
        borderColor: isMine ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.12)',
        backgroundColor: isMine ? 'rgba(255,255,255,0.12)' : '#f8fafc',
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar
          variant="rounded"
          src={payload.imageUrl || undefined}
          alt={payload.title}
          sx={{ width: 56, height: 56 }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Chip
            size="small"
            icon={<GraphicEqRoundedIcon fontSize="small" />}
            label="Son partage"
            sx={{
              mb: 0.75,
              borderRadius: 1.5,
              color: isMine ? '#fff' : '#1f2937',
              borderColor: isMine ? 'rgba(255,255,255,0.24)' : undefined,
            }}
            variant="outlined"
          />
          <Typography sx={{ fontWeight: 700 }} noWrap>
            {payload.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{ opacity: isMine ? 0.88 : 0.72 }}
            noWrap
          >
            {[payload.artist, payload.album].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </Stack>

      {payload.previewUrl ? (
        <Box sx={{ mt: 1 }}>
          <audio
            controls
            preload="none"
            src={payload.previewUrl}
            style={{ width: '100%', maxWidth: '100%' }}
          />
        </Box>
      ) : null}
    </Paper>
  );
}
