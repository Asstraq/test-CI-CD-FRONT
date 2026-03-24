'use client';

import ReportContentDialog from '@/components/ReportContentDialog';
import MessageBody from '@/components/messaging/MessageBody';
import ProfileIdentityLink from '@/components/ProfileIdentityLink';
import { getMessageTimeLabel } from '@/components/messaging/floatingMessenger.utils';
import type { ConversationMessage } from '@/type/messages';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type FloatingMessengerConversationViewProps = {
  currentUserId: string | null;
  messages: ConversationMessage[];
  loading: boolean;
  draft: string;
  sending: boolean;
  onDraftChange: (value: string) => void;
  onSendMessage: () => Promise<void>;
};

export default function FloatingMessengerConversationView({
  currentUserId,
  messages,
  loading,
  draft,
  sending,
  onDraftChange,
  onSendMessage,
}: FloatingMessengerConversationViewProps) {
  const [reportedMessageId, setReportedMessageId] = useState<number | null>(
    null,
  );
  const [reportSuccess, setReportSuccess] = useState('');

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
                    <ProfileIdentityLink
                      profile={message.sender}
                      avatarSize={20}
                      nameVariant="caption"
                      sx={{ mb: 0.5 }}
                      nameSx={{ fontWeight: 700 }}
                    />
                  ) : null}
                  <MessageBody
                    content={message.content}
                    isMine={Boolean(isMine)}
                  />
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
                  {!isMine ? (
                    <Button
                      size="small"
                      startIcon={<FlagRoundedIcon fontSize="small" />}
                      onClick={() => setReportedMessageId(Number(message.id))}
                      sx={{
                        mt: 0.5,
                        px: 0,
                        minWidth: 0,
                        color: isMine ? '#fff' : '#334155',
                      }}
                    >
                      Signaler
                    </Button>
                  ) : null}
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
      {reportedMessageId ? (
        <ReportContentDialog
          open={Boolean(reportedMessageId)}
          onClose={() => setReportedMessageId(null)}
          onReported={setReportSuccess}
          targetType="MESSAGE"
          targetId={reportedMessageId}
          title="Signaler ce message"
          description="Le message sera transmis à la modération."
        />
      ) : null}
      <Snackbar
        open={Boolean(reportSuccess)}
        autoHideDuration={3500}
        onClose={() => setReportSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setReportSuccess('')}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {reportSuccess}
        </Alert>
      </Snackbar>
    </>
  );
}
