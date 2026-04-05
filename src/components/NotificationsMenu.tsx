'use client';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications.api';
import { buildProfileHref } from '@/lib/profile/profileHref';
import type { NotificationItem } from '@/type/notifications';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';

function getDateLabel(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function getNotificationTitle(notification: NotificationItem): string {
  if (notification.type === 'FOLLOW') {
    return `${notification.actor.name} vous suit`;
  }

  if (notification.type === 'FOLLOW_REQUEST') {
    return `${notification.actor.name} vous a envoyé une demande`;
  }

  if (notification.type === 'FOLLOW_REQUEST_ACCEPTED') {
    return `${notification.actor.name} a accepté votre demande`;
  }

  if (notification.type === 'REVIEW_LIKED') {
    return `${notification.actor.name} a aimé votre post`;
  }

  return `${notification.actor.name} a commenté votre post`;
}

function getNotificationSubtitle(notification: NotificationItem): string {
  if (
    notification.type === 'REVIEW_COMMENTED' &&
    notification.comment?.content
  ) {
    return notification.comment.content;
  }

  if (notification.review?.content?.trim()) {
    return notification.review.content.trim();
  }

  if (notification.type === 'FOLLOW_REQUEST') {
    return 'Demande de suivi en attente';
  }

  if (notification.type === 'FOLLOW_REQUEST_ACCEPTED') {
    return 'Vous pouvez maintenant voir son activité';
  }

  if (notification.type === 'FOLLOW') {
    return 'Nouveau follower';
  }

  return 'Interaction sur votre activité';
}

export default function NotificationsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');

  const open = Boolean(anchorEl);
  const hasUnread = unreadCount > 0;

  const unreadIds = useMemo(
    () =>
      new Set(
        notifications
          .filter((notification) => !notification.readAt)
          .map((notification) => notification.id),
      ),
    [notifications],
  );

  async function loadNotifications() {
    setLoading(true);
    setError('');

    try {
      const response = await listNotifications(6);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadNotificationsCount);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Impossible de charger les notifications.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleOpen = async (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    await loadNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setError('');
  };

  const handleReadNotification = async (notificationId: string) => {
    if (!unreadIds.has(notificationId)) return;

    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: updated.readAt }
            : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : 'Impossible de marquer la notification comme lue.',
      );
    }
  };

  const handleReadAll = async () => {
    if (!hasUnread || markingAll) return;

    setMarkingAll(true);
    setError('');

    try {
      const response = await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? response.readAt,
        })),
      );
      setUnreadCount(0);
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : 'Impossible de marquer les notifications comme lues.',
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={(event) => {
          void handleOpen(event);
        }}
        sx={{
          border: '1px solid rgba(15,23,42,0.08)',
          bgcolor: 'rgba(255,255,255,0.72)',
        }}
      >
        <Badge
          color="error"
          badgeContent={unreadCount > 0 ? unreadCount : undefined}
        >
          <NotificationsRoundedIcon />
        </Badge>
      </IconButton>

      <Popper
        anchorEl={anchorEl}
        open={open}
        placement="bottom-end"
        disablePortal
        sx={{
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={10}
            sx={{
              mt: 1.25,
              width: 420,
              maxWidth: 'calc(100vw - 24px)',
              borderRadius: 3,
              border: '1px solid rgba(15,23,42,0.08)',
              overflow: 'hidden',
            }}
          >
            <Stack spacing={0}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2, py: 1.5 }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#111827' }}>
                    Notifications
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    6 dernières notifications
                  </Typography>
                </Box>
                <Button size="small" onClick={() => void handleReadAll()}>
                  {markingAll ? 'Lecture...' : 'Tout lire'}
                </Button>
              </Stack>

              <Divider />

              {loading ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ py: 5 }}
                >
                  <CircularProgress size={24} />
                </Stack>
              ) : null}

              {!loading && error ? (
                <Typography sx={{ px: 2, py: 2, color: '#dc2626' }}>
                  {error}
                </Typography>
              ) : null}

              {!loading && !error ? (
                notifications.length > 0 ? (
                  <List disablePadding>
                    {notifications.map((notification, index) => {
                      const profileHref = buildProfileHref(notification.actor);

                      return (
                        <Box key={notification.id}>
                          <ListItemButton
                            onClick={() => {
                              void handleReadNotification(notification.id);
                            }}
                            sx={{
                              alignItems: 'flex-start',
                              py: 1.5,
                              px: 2,
                              bgcolor: notification.readAt
                                ? 'transparent'
                                : 'rgba(249,115,22,0.08)',
                            }}
                          >
                            <ListItemAvatar>
                              {profileHref ? (
                                <Link href={profileHref}>
                                  <Avatar
                                    src={
                                      notification.actor.avatarUrl || undefined
                                    }
                                  >
                                    {notification.actor.name
                                      .charAt(0)
                                      .toUpperCase()}
                                  </Avatar>
                                </Link>
                              ) : (
                                <Avatar
                                  src={
                                    notification.actor.avatarUrl || undefined
                                  }
                                >
                                  {notification.actor.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </Avatar>
                              )}
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  justifyContent="space-between"
                                >
                                  <Typography
                                    sx={{
                                      fontWeight: notification.readAt
                                        ? 600
                                        : 700,
                                      color: '#111827',
                                    }}
                                  >
                                    {getNotificationTitle(notification)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#64748b', flexShrink: 0 }}
                                  >
                                    {getDateLabel(notification.createdAt)}
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: '#475569' }}
                                  >
                                    {getNotificationSubtitle(notification)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#94a3b8' }}
                                  >
                                    {notification.actor.handle}
                                  </Typography>
                                </Stack>
                              }
                            />
                          </ListItemButton>
                          {index < notifications.length - 1 ? (
                            <Divider />
                          ) : null}
                        </Box>
                      );
                    })}
                  </List>
                ) : (
                  <Typography sx={{ px: 2, py: 4, color: '#64748b' }}>
                    Aucune notification pour le moment.
                  </Typography>
                )
              ) : null}
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}
