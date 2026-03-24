'use client';

import { getMessageSnippet } from '@/lib/messages/track-share';
import type { ConversationSummary } from '@/type/messages';
import {
  Avatar,
  Badge,
  Box,
  CircularProgress,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';

type FloatingMessengerConversationListProps = {
  conversations: ConversationSummary[];
  loading: boolean;
  onSelectConversation: (conversationId: string) => void;
};

export default function FloatingMessengerConversationList({
  conversations,
  loading,
  onSelectConversation,
}: FloatingMessengerConversationListProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Aucune conversation disponible pour le moment.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ py: 0 }}>
      {conversations.map((conversation) => (
        <ListItemButton
          key={conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          sx={{ px: 2, py: 1.25 }}
        >
          <ListItemAvatar>
            <Badge
              color="error"
              overlap="circular"
              badgeContent={
                conversation.unreadCount > 0
                  ? conversation.unreadCount
                  : undefined
              }
            >
              <Avatar src={conversation.participant.avatarUrl || undefined}>
                {conversation.participant.name.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={conversation.participant.name}
            secondary={
              (conversation.lastMessage?.content
                ? getMessageSnippet(conversation.lastMessage.content)
                : '') || 'Aucun message pour le moment.'
            }
            primaryTypographyProps={{ fontWeight: 700 }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}
