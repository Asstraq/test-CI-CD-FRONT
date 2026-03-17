'use client';

import { getMessageTimeLabel } from '@/components/messaging/floatingMessenger.utils';
import { buildProfileHref } from '@/lib/profile/profileHref';
import type { ConversationMessage, ConversationSummary } from '@/type/messages';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';

type FloatingMessengerConversationViewProps = {
  currentConversation: ConversationSummary;
  currentUserId: string | null;
  messages: ConversationMessage[];
  loading: boolean;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
};

export default function FloatingMessengerConversationView({
  currentConversation,
  currentUserId,
  messages,
  loading,
  draft,
  sending,
  onDraftChange,
  onSendMessage,
}: FloatingMessengerConversationViewProps) {
  const participantHref = buildProfileHref({
    id: currentConversation.participant.id,
    name: currentConversation.participant.name,
    handle: currentConversation.participant.handle,
    email: currentConversation.participant.email,
    avatarUrl: currentConversation.participant.avatarUrl,
  });

  return (
    <>
      <Divider />
      <Stack
        spacing={1}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 1.25,
          bgcolor: '#f8fafc',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', p: 4 }}>
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
                    p: 1.1,
                    borderRadius: 2.5,
                    bgcolor: isMine ? '#2563eb' : '#e2e8f0',
                    color: isMine ? '#fff' : '#0f172a',
                  }}
                >
                  {!isMine ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      {participantHref ? (
                        <>
                          <Avatar
                            component={Link}
                            href={participantHref}
                            src={
                              currentConversation.participant.avatarUrl ||
                              undefined
                            }
                            sx={{
                              width: 20,
                              height: 20,
                              textDecoration: 'none',
                            }}
                          >
                            {message.sender.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            component={Link}
                            href={participantHref}
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'inherit',
                              textDecoration: 'none',
                            }}
                          >
                            {message.sender.name}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Avatar
                            src={
                              currentConversation.participant.avatarUrl ||
                              undefined
                            }
                            sx={{ width: 20, height: 20 }}
                          >
                            {message.sender.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700 }}
                          >
                            {message.sender.name}
                          </Typography>
                        </>
                      )}
                    </Stack>
                  ) : null}
                  <Typography variant="body2">{message.content}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      opacity: 0.8,
                      textAlign: 'right',
                    }}
                  >
                    {getMessageTimeLabel(message.createdAt)}
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
      <Divider />
      <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ p: 1.25 }}>
        <TextField
          fullWidth
          size="small"
          label="Votre message"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void onSendMessage();
            }
          }}
          multiline
          minRows={1}
          maxRows={3}
        />
        <IconButton
          color="primary"
          onClick={() => void onSendMessage()}
          disabled={sending || !draft.trim()}
        >
          {sending ? <CircularProgress size={18} /> : <SendRoundedIcon />}
        </IconButton>
      </Stack>
    </>
  );
}
