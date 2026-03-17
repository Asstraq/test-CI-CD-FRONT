'use client';

import {
  buildProfileHref,
  type ProfileLinkInput,
} from '@/lib/profile/profileHref';
import {
  Avatar,
  Stack,
  type SxProps,
  type Theme,
  Typography,
  type TypographyProps,
} from '@mui/material';
import Link from 'next/link';

type ProfileIdentityLinkProps = {
  profile: ProfileLinkInput;
  showAvatar?: boolean;
  showName?: boolean;
  avatarSize?: number;
  spacing?: number;
  nameVariant?: TypographyProps['variant'];
  stopPropagation?: boolean;
  sx?: SxProps<Theme>;
  avatarSx?: SxProps<Theme>;
  nameSx?: SxProps<Theme>;
};

export default function ProfileIdentityLink({
  profile,
  showAvatar = true,
  showName = true,
  avatarSize = 40,
  spacing = 1,
  nameVariant = 'body1',
  stopPropagation = false,
  sx,
  avatarSx,
  nameSx,
}: ProfileIdentityLinkProps) {
  const href = buildProfileHref(profile);
  const name = profile.name?.trim() || 'Utilisateur';
  const onClick = stopPropagation
    ? (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
      }
    : undefined;

  const avatar = showAvatar ? (
    href ? (
      <Avatar
        component={Link}
        href={href}
        onClick={onClick}
        src={profile.avatarUrl?.trim() || undefined}
        sx={{
          width: avatarSize,
          height: avatarSize,
          textDecoration: 'none',
          ...avatarSx,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    ) : (
      <Avatar
        src={profile.avatarUrl?.trim() || undefined}
        sx={{ width: avatarSize, height: avatarSize, ...avatarSx }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    )
  ) : null;

  const label = showName ? (
    href ? (
      <Typography
        component={Link}
        href={href}
        onClick={onClick}
        variant={nameVariant}
        sx={{
          color: 'inherit',
          textDecoration: 'none',
          ...nameSx,
        }}
      >
        {name}
      </Typography>
    ) : (
      <Typography variant={nameVariant} sx={nameSx}>
        {name}
      </Typography>
    )
  ) : null;

  if (!avatar && !label) return null;
  if (avatar && !label) return avatar;
  if (!avatar && label) return label;

  return (
    <Stack direction="row" spacing={spacing} alignItems="center" sx={sx}>
      {avatar}
      {label}
    </Stack>
  );
}
