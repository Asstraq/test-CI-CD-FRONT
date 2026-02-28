'use client';

import type { FeedShare, FeedUser } from '@/type/feed';
import AlbumRoundedIcon from '@mui/icons-material/AlbumRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import MicExternalOnRoundedIcon from '@mui/icons-material/MicExternalOnRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import SupervisedUserCircleRoundedIcon from '@mui/icons-material/SupervisedUserCircleRounded';
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

type FeedPostProps = {
  share: FeedShare;
  author: FeedUser;
};

function getDateLabel(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getSharedMeta(share: FeedShare): {
  kindLabel: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
} {
  if (share.shared.kind === 'TRACK') {
    return {
      kindLabel: 'Son',
      title: share.shared.title,
      subtitle: share.shared.album
        ? `${share.shared.artist} · ${share.shared.album}`
        : share.shared.artist,
      imageUrl: share.shared.imageUrl,
    };
  }

  if (share.shared.kind === 'ALBUM') {
    return {
      kindLabel: 'Album',
      title: share.shared.title,
      subtitle: share.shared.year
        ? `${share.shared.artist} · ${share.shared.year}`
        : share.shared.artist,
      imageUrl: share.shared.imageUrl,
    };
  }

  return {
    kindLabel: 'Artiste',
    title: share.shared.name,
    subtitle: share.shared.genres?.join(' · ') ?? 'Artiste recommande',
    imageUrl: share.shared.imageUrl,
  };
}

function getSharedIcon(kind: FeedShare['shared']['kind']) {
  if (kind === 'TRACK') return <GraphicEqRoundedIcon fontSize="small" />;
  if (kind === 'ALBUM') return <AlbumRoundedIcon fontSize="small" />;
  return <MicExternalOnRoundedIcon fontSize="small" />;
}

export default function FeedPost({ share, author }: FeedPostProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isPublic = share.visibility === 'PUBLIC';
  const sharedMeta = getSharedMeta(share);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: '1px solid rgba(40, 52, 82, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={author.avatarUrl} alt={author.name} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: '#1b2130' }}>
              {author.name}
            </Typography>
            <Typography variant="body2" sx={{ color: '#5c6780' }}>
              {author.handle} · {getDateLabel(share.createdAt)}
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={
              isPublic ? (
                <PublicRoundedIcon fontSize="small" />
              ) : (
                <SupervisedUserCircleRoundedIcon fontSize="small" />
              )
            }
            label={isPublic ? 'Public' : 'Abonnes'}
            sx={{ ml: 'auto', borderRadius: 2 }}
          />
        </Stack>

        <Typography sx={{ color: '#273248' }}>{share.content}</Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            backgroundColor: '#f6f8ff',
            borderColor: 'rgba(112, 130, 180, 0.25)',
          }}
        >
          <Avatar
            variant="rounded"
            src={sharedMeta.imageUrl}
            alt={sharedMeta.title}
            sx={{ width: 56, height: 56 }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={getSharedIcon(share.shared.kind)}
                label={sharedMeta.kindLabel}
                sx={{ height: 22, borderRadius: 1.5 }}
              />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <StarRoundedIcon sx={{ fontSize: 16, color: '#f59f00' }} />
                <Typography variant="caption" sx={{ color: '#4b5670' }}>
                  {share.rating}/5
                </Typography>
              </Stack>
            </Stack>
            <Typography
              sx={{ fontWeight: 700, color: '#1b2130', mt: 0.5 }}
              noWrap
            >
              {sharedMeta.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#54607a' }} noWrap>
              {sharedMeta.subtitle}
            </Typography>
          </Box>
        </Paper>

        <Stack
          direction="row"
          spacing={2.5}
          sx={{ color: '#5f6f92' }}
          justifyContent={isMobile ? 'space-between' : 'flex-start'}
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <FavoriteBorderRoundedIcon fontSize="small" />
            <Typography variant="body2">{share.likes}</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ChatBubbleOutlineRoundedIcon fontSize="small" />
            <Typography variant="body2">{share.comments}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
