import MessagesInbox from '@/components/MessagesInbox';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';

export default function MessagesPage() {
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
                Messagerie privee
              </Typography>
              <Typography sx={{ color: '#64748b', mt: 1 }}>
                Les conversations sont disponibles uniquement entre utilisateurs
                qui se suivent mutuellement.
              </Typography>
            </Box>
            <MessagesInbox />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
