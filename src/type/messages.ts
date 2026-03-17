export type MessageUser = {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl: string;
};

export type ConversationMessage = {
  id: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender: MessageUser;
};

export type ConversationSummary = {
  id: string;
  participant: MessageUser;
  lastMessage?: ConversationMessage;
  unreadCount: number;
  updatedAt: string;
};
