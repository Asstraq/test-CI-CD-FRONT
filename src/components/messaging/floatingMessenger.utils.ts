import type { ConversationSummary } from '@/type/messages';

export function getMessageTimeLabel(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function sortConversations(items: ConversationSummary[]) {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
