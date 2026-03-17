import { api } from '@/lib/api/http';
import type {
  ConversationMessage,
  ConversationSummary,
  MessageUser,
} from '@/type/messages';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readId(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function normalizeUser(entry: unknown): MessageUser {
  const item = asRecord(entry);
  const name =
    readString(
      item?.name,
      item?.nom,
      item?.username,
      item?.handle,
      item?.email,
    ) ?? 'Utilisateur';
  const handleBase =
    readString(
      item?.handle,
      item?.username,
      item?.slug,
      item?.name,
      item?.nom,
    ) ?? name;

  return {
    id: readId(item?.id, item?.userId, item?.email) ?? 'unknown-user',
    name,
    handle: handleBase.startsWith('@')
      ? handleBase
      : `@${handleBase.replace(/\s+/g, '').toLowerCase()}`,
    email: readString(item?.email) ?? '',
    avatarUrl:
      readString(
        item?.avatarUrl,
        item?.avatar,
        item?.imageUrl,
        item?.photoUrl,
      ) ?? '',
  };
}

function normalizeMessage(entry: unknown): ConversationMessage | null {
  const wrapper = asRecord(entry);
  const item =
    asRecord(wrapper?.message) ??
    asRecord(wrapper?.data) ??
    asRecord(wrapper?.item) ??
    wrapper;
  if (!item) return null;

  const sender =
    asRecord(item.sender) ??
    asRecord(item.author) ??
    asRecord(item.user) ??
    asRecord(item.from);

  return {
    id: readId(item.id, item.messageId) ?? '',
    content: readString(item.content, item.text, item.body) ?? '',
    createdAt:
      readString(item.createdAt, item.created_at) ?? new Date().toISOString(),
    readAt: readString(item.readAt, item.read_at) ?? null,
    sender: normalizeUser(sender),
  };
}

function normalizeConversation(entry: unknown): ConversationSummary | null {
  const wrapper = asRecord(entry);
  const item =
    asRecord(wrapper?.conversation) ??
    asRecord(wrapper?.data) ??
    asRecord(wrapper?.item) ??
    wrapper;
  if (!item) return null;

  const participant =
    asRecord(item.participant) ??
    asRecord(item.otherUser) ??
    asRecord(item.user) ??
    asRecord(item.targetUser);
  const lastMessage =
    normalizeMessage(item.lastMessage) ?? normalizeMessage(item.message);

  return {
    id: readId(item.id, item.conversationId) ?? '',
    participant: normalizeUser(participant),
    lastMessage: lastMessage ?? undefined,
    unreadCount:
      readNumber(item.unreadCount, item.unreadMessages, item.unread_messages) ??
      0,
    updatedAt:
      readString(
        item.updatedAt,
        item.updated_at,
        lastMessage?.createdAt,
        item.createdAt,
        item.created_at,
      ) ?? new Date().toISOString(),
  };
}

export async function openConversation(userId: string) {
  const response = await api<unknown>(`/messages/conversations/${userId}`, {
    method: 'POST',
  });

  const conversation = normalizeConversation(response);
  if (!conversation?.id) {
    throw new Error('Conversation introuvable.');
  }

  return conversation;
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const response = await api<unknown>('/messages/conversations');
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.conversations).length > 0
      ? asArray(root?.conversations)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.data);

  return items
    .map(normalizeConversation)
    .filter((conversation): conversation is ConversationSummary =>
      Boolean(conversation?.id),
    );
}

export async function listConversationMessages(
  conversationId: string,
): Promise<ConversationMessage[]> {
  const response = await api<unknown>(
    `/messages/conversations/${conversationId}/messages`,
  );
  const root = asRecord(response);
  const items = Array.isArray(response)
    ? response
    : asArray(root?.messages).length > 0
      ? asArray(root?.messages)
      : asArray(root?.items).length > 0
        ? asArray(root?.items)
        : asArray(root?.data);

  return items
    .map(normalizeMessage)
    .filter((message): message is ConversationMessage => Boolean(message?.id));
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
) {
  const response = await api<unknown>(
    `/messages/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      body: { content },
    },
  );

  return normalizeMessage(response);
}

export function markConversationRead(conversationId: string) {
  return api<{ ok?: boolean }>(
    `/messages/conversations/${conversationId}/read`,
    {
      method: 'POST',
    },
  );
}
