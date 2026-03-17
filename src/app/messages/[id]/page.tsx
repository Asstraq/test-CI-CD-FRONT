import MessagesInbox from '@/components/MessagesInbox';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f4f4f0 0%, #e9efff 100%)',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.7)',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Conversation
              </Typography>
              <Typography sx={{ color: '#64748b', mt: 1 }}>
                Conversation privee entre deux utilisateurs en suivi mutuel.
              </Typography>
            </Box>
            <MessagesInbox activeConversationId={id} />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
