'use client';

import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import { Badge, Fab } from '@mui/material';

type FloatingMessengerLauncherProps = {
  unreadCount: number;
  onOpen: () => void;
};

export default function FloatingMessengerLauncher({
  unreadCount,
  onOpen,
}: FloatingMessengerLauncherProps) {
  return (
    <Badge
      color="error"
      badgeContent={unreadCount > 0 ? unreadCount : undefined}
    >
      <Fab
        color="primary"
        variant="extended"
        onClick={onOpen}
        sx={{
          borderRadius: 999,
          px: 2.25,
          boxShadow: '0 16px 36px rgba(37,99,235,0.28)',
        }}
      >
        <ChatRoundedIcon sx={{ mr: 1 }} />
        Messages
      </Fab>
    </Badge>
  );
}
