'use client';

import FloatingMessengerConversationList from '@/components/messaging/FloatingMessengerConversationList';
import FloatingMessengerConversationView from '@/components/messaging/FloatingMessengerConversationView';
import FloatingMessengerLauncher from '@/components/messaging/FloatingMessengerLauncher';
import { sortConversations } from '@/components/messaging/floatingMessenger.utils';
import {
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from '@/lib/api/messages.api';
import { useUserSession } from '@/lib/auth/userSession';
import type { ConversationMessage, ConversationSummary } from '@/type/messages';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function FloatingMessenger() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserSession();
  const currentUserId = user?.user.id ? String(user.user.id) : null;
  const isHidden =
    !user || pathname.startsWith('/auth') || pathname.startsWith('/messages');

  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const currentConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  const unreadCount = useMemo(
    () =>
      conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0,
      ),
    [conversations],
  );

  useEffect(() => {
    if (isHidden) return;

    let active = true;

    async function loadConversations() {
      try {
        setLoadingConversations(true);
        const nextConversations = sortConversations(await listConversations());
        if (!active) return;
        setConversations(nextConversations);
        setActiveConversationId((prev) =>
          prev &&
          nextConversations.some((conversation) => conversation.id === prev)
            ? prev
            : null,
        );
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Impossible de charger les conversations.',
        );
      } finally {
        if (active) setLoadingConversations(false);
      }
    }

    void loadConversations();

    return () => {
      active = false;
    };
  }, [isHidden]);

  useEffect(() => {
    if (!open || !activeConversationId) return;

    let active = true;

    async function loadMessages() {
      try {
        setLoadingMessages(true);
        setError('');
        const nextMessages =
          await listConversationMessages(activeConversationId);
        if (!active) return;
        setMessages(nextMessages);
        await markConversationRead(activeConversationId);
        if (!active) return;
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Impossible de charger les messages.',
        );
      } finally {
        if (active) setLoadingMessages(false);
      }
    }

    void loadMessages();

    return () => {
      active = false;
    };
  }, [activeConversationId, open]);

  if (isHidden) return null;

  const handleOpen = async () => {
    setOpen(true);
    setError('');

    if (conversations.length > 0 || loadingConversations) return;

    try {
      setLoadingConversations(true);
      setConversations(sortConversations(await listConversations()));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Impossible de charger les conversations.',
      );
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMessages([]);
    setError('');
  };

  const handleSendMessage = async () => {
    if (!activeConversationId || !draft.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const created = await sendConversationMessage(
        activeConversationId,
        draft.trim(),
      );
      if (!created) {
        throw new Error('Message non retourne par le backend.');
      }

      setMessages((prev) => [...prev, created]);
      setDraft('');
      setConversations((prev) =>
        sortConversations(
          prev.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  lastMessage: created,
                  updatedAt: created.createdAt,
                }
              : conversation,
          ),
        ),
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Impossible d envoyer le message.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 12, sm: 20 },
        bottom: { xs: 12, sm: 20 },
        zIndex: 1400,
      }}
    >
      {!open ? (
        <FloatingMessengerLauncher
          unreadCount={unreadCount}
          onOpen={() => {
            void handleOpen();
          }}
        />
      ) : (
        <Paper
          elevation={18}
          sx={{
            width: { xs: 'calc(100vw - 24px)', sm: 380 },
            height: { xs: '70vh', sm: 560 },
            maxHeight: '80vh',
            overflow: 'hidden',
            borderRadius: 4,
            border: '1px solid rgba(15,23,42,0.08)',
            bgcolor: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <Stack sx={{ height: '100%' }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: '#1d4ed8',
                color: '#fff',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {activeConversationId ? (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setActiveConversationId(null);
                      setMessages([]);
                      setError('');
                    }}
                    sx={{ color: '#fff' }}
                  >
                    <ArrowBackRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <Typography sx={{ fontWeight: 700 }}>
                  {currentConversation
                    ? currentConversation.participant.name
                    : 'Messagerie'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  sx={{ color: '#fff' }}
                  onClick={() =>
                    router.push(
                      currentConversation
                        ? `/messages/${currentConversation.id}`
                        : '/messages',
                    )
                  }
                >
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ color: '#fff' }}
                  onClick={() => {
                    setOpen(false);
                    setActiveConversationId(null);
                    setMessages([]);
                    setError('');
                  }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {error ? (
              <Typography sx={{ px: 2, pt: 1.5, color: '#c62828' }}>
                {error}
              </Typography>
            ) : null}

            {!activeConversationId ? (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <FloatingMessengerConversationList
                  conversations={conversations}
                  loading={loadingConversations}
                  onSelectConversation={handleSelectConversation}
                />
              </Box>
            ) : (
              currentConversation && (
                <FloatingMessengerConversationView
                  currentConversation={currentConversation}
                  currentUserId={currentUserId}
                  messages={messages}
                  loading={loadingMessages}
                  draft={draft}
                  sending={sending}
                  onDraftChange={setDraft}
                  onSendMessage={handleSendMessage}
                />
              )
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
