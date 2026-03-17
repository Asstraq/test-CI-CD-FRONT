'use client';

'use client';

import ProfileIdentityLink from '@/components/ProfileIdentityLink';
import { sortMessages } from '@/components/messaging/floatingMessenger.utils';
import {
  listConversationMessages,
  listConversations,
  markConversationRead,
  sendConversationMessage,
} from '@/lib/api/messages.api';
import { useUserSession } from '@/lib/auth/userSession';
import type { ConversationMessage, ConversationSummary } from '@/type/messages';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function getDateLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

type MessagesInboxProps = {
  activeConversationId?: string;
};

export default function MessagesInbox({
  activeConversationId,
}: MessagesInboxProps) {
  const router = useRouter();
  const { user } = useUserSession();
  const currentUserId = user?.user.id ? String(user.user.id) : null;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const currentConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    let active = true;

    async function loadConversations() {
      try {
        setLoadingConversations(true);
        setConversationError('');
        const nextConversations = await listConversations();
        if (!active) return;
        setConversations(nextConversations);

        if (!activeConversationId && nextConversations[0]?.id) {
          router.replace(`/messages/${nextConversations[0].id}`);
        }
      } catch (error) {
        if (!active) return;
        setConversationError(
          error instanceof Error
            ? error.message
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
  }, [activeConversationId, router]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      if (!activeConversationId) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        setMessageError('');
        const nextMessages = sortMessages(
          await listConversationMessages(activeConversationId),
        );
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
      } catch (error) {
        if (!active) return;
        setMessageError(
          error instanceof Error
            ? error.message
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
  }, [activeConversationId]);

  const handleSendMessage = async () => {
    if (!activeConversationId || !draft.trim() || sending) return;

    setSending(true);
    setMessageError('');

    try {
      const created = await sendConversationMessage(
        activeConversationId,
        draft.trim(),
      );
      if (!created) {
        throw new Error('Message non retourne par le backend.');
      }

      setMessages((prev) => sortMessages([...prev, created]));
      setDraft('');
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                lastMessage: created,
                updatedAt: created.createdAt,
              }
            : conversation,
        ),
      );
    } catch (error) {
      setMessageError(
        error instanceof Error
          ? error.message
          : 'Impossible d envoyer le message.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={3}
      alignItems="stretch"
    >
      <Paper
        variant="outlined"
        sx={{
          width: { xs: '100%', md: 320 },
          borderRadius: 3,
          p: 2,
          bgcolor: 'rgba(248, 249, 255, 0.92)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Conversations
        </Typography>

        {conversationError ? (
          <Typography sx={{ color: '#c62828' }}>{conversationError}</Typography>
        ) : null}

        {loadingConversations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length > 0 ? (
          <List sx={{ py: 0 }}>
            {conversations.map((conversation) => {
              return (
                <ListItemButton
                  key={conversation.id}
                  selected={conversation.id === activeConversationId}
                  onClick={() => router.push(`/messages/${conversation.id}`)}
                  sx={{ borderRadius: 2, mb: 0.75 }}
                >
                  <ListItemAvatar>
                    <ProfileIdentityLink
                      profile={conversation.participant}
                      showName={false}
                      stopPropagation
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <ProfileIdentityLink
                        profile={conversation.participant}
                        showAvatar={false}
                        stopPropagation
                        nameSx={{ fontWeight: 500 }}
                      />
                    }
                    secondary={
                      conversation.lastMessage?.content ||
                      'Aucun message pour le moment.'
                    }
                  />
                  {conversation.unreadCount > 0 ? (
                    <Box
                      sx={{
                        minWidth: 22,
                        height: 22,
                        borderRadius: 999,
                        bgcolor: '#2563eb',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        px: 0.75,
                      }}
                    >
                      {conversation.unreadCount}
                    </Box>
                  ) : null}
                </ListItemButton>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucune conversation disponible.
          </Typography>
        )}
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          borderRadius: 3,
          p: 2,
          bgcolor: 'rgba(255,255,255,0.95)',
        }}
      >
        {currentConversation ? (
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ProfileIdentityLink
                profile={currentConversation.participant}
                showName={false}
              />
              <Box>
                <ProfileIdentityLink
                  profile={currentConversation.participant}
                  showAvatar={false}
                  nameSx={{ fontWeight: 700 }}
                />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {currentConversation.participant.handle}
                </Typography>
              </Box>
            </Stack>

            {messageError ? (
              <Typography sx={{ color: '#c62828' }}>{messageError}</Typography>
            ) : null}

            <Stack
              spacing={1}
              sx={{
                minHeight: 320,
                maxHeight: 520,
                overflowY: 'auto',
                pr: 0.5,
              }}
            >
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length > 0 ? (
                messages.map((message) => {
                  const isMine =
                    currentUserId &&
                    String(message.sender.id) === String(currentUserId);

                  return (
                    <Stack
                      key={message.id}
                      alignItems={isMine ? 'flex-end' : 'flex-start'}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          maxWidth: '82%',
                          p: 1.25,
                          borderRadius: 2.5,
                          bgcolor: isMine ? '#2563eb' : '#eef2ff',
                          color: isMine ? '#fff' : '#1f2937',
                        }}
                      >
                        {!isMine ? (
                          <ProfileIdentityLink
                            profile={message.sender}
                            avatarSize={20}
                            nameVariant="caption"
                            sx={{ mb: 0.5 }}
                            nameSx={{ fontWeight: 700 }}
                          />
                        ) : null}
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.8,
                            textAlign: 'right',
                          }}
                        >
                          {getDateLabel(message.createdAt)}
                        </Typography>
                      </Paper>
                    </Stack>
                  );
                })
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun message dans cette conversation.
                </Typography>
              )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                size="small"
                label="Votre message"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                multiline
                minRows={1}
                maxRows={4}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={sending || !draft.trim()}
              >
                {sending ? <CircularProgress size={18} /> : <SendRoundedIcon />}
              </IconButton>
            </Stack>
          </Stack>
        ) : (
          <Box
            sx={{
              minHeight: 320,
              display: 'grid',
              placeItems: 'center',
              color: '#64748b',
            }}
          >
            <Typography>
              Selectionnez une conversation pour commencer a discuter.
            </Typography>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
