import { api } from '@/lib/api/http';
import type {
  CreateReportPayload,
  ReportItem,
  ReportStatus,
  ReportTarget,
  ReportUser,
} from '@/type/reports';

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

function buildUser(entry: unknown): ReportUser | undefined {
  const item = asRecord(entry);
  if (!item) return undefined;

  const name =
    readString(item.nom, item.name, item.prenom, item.pseudo, item.email) ??
    'Utilisateur';

  return {
    id: String(readNumber(item.id) ?? readString(item.id) ?? ''),
    name,
    email: readString(item.email),
    handle: readString(item.pseudo),
    avatarUrl: readString(item.avatarUrl),
    role: readString(item.role),
  };
}

function normalizeTarget(entry: unknown): ReportTarget | null {
  const item = asRecord(entry);
  const kind = readString(item?.kind)?.toUpperCase();
  if (!item || !kind) return null;

  if (kind === 'REVIEW') {
    const review = asRecord(item.review);
    const media = asRecord(review?.media);
    return {
      kind: 'REVIEW',
      review: {
        id: readNumber(review?.id) ?? 0,
        content: readString(review?.content) ?? null,
        rating: readNumber(review?.rating) ?? null,
        createdAt: readString(review?.createdAt),
        user: buildUser(review?.user),
        media: media
          ? {
              title: readString(media.title),
              imageUrl: readString(media.imageUrl) ?? null,
              spotifyId: readString(media.spotifyId),
              type: readString(media.type),
            }
          : undefined,
      },
    };
  }

  if (kind === 'MESSAGE') {
    const message = asRecord(item.message);
    const conversation = asRecord(message?.conversation);
    return {
      kind: 'MESSAGE',
      message: {
        id: readNumber(message?.id) ?? 0,
        content: readString(message?.content) ?? null,
        createdAt: readString(message?.createdAt),
        sender: buildUser(message?.sender),
        conversation: conversation
          ? {
              id: readNumber(conversation.id) ?? 0,
              userA: buildUser(conversation.userA),
              userB: buildUser(conversation.userB),
            }
          : undefined,
      },
    };
  }

  if (kind === 'USER') {
    const user = buildUser(item.user);
    return user ? { kind: 'USER', user } : null;
  }

  if (kind === 'REVIEW_COMMENT') {
    const reviewComment = asRecord(item.reviewComment);
    return {
      kind: 'REVIEW_COMMENT',
      reviewComment: {
        id: readNumber(reviewComment?.id) ?? 0,
        content: readString(reviewComment?.content) ?? null,
        createdAt: readString(reviewComment?.createdAt),
        user: buildUser(reviewComment?.user),
      },
    };
  }

  if (kind === 'LIST') {
    const list = asRecord(item.list);
    return {
      kind: 'LIST',
      list: {
        id: readNumber(list?.id) ?? 0,
        name: readString(list?.name),
        isPublic: Boolean(list?.isPublic),
        createdAt: readString(list?.createdAt),
        user: buildUser(list?.user),
      },
    };
  }

  return null;
}

function normalizeReport(entry: unknown): ReportItem | null {
  const item = asRecord(entry);
  if (!item) return null;

  const id = readNumber(item.id);
  const targetId = readNumber(item.targetId);
  const createdAt = readString(item.createdAt);

  if (!id || !targetId || !createdAt) return null;

  return {
    id,
    targetType: readString(item.targetType) ?? 'REVIEW',
    targetId,
    reason: readString(item.reason) ?? 'OTHER',
    details: readString(item.details) ?? null,
    status: readString(item.status) ?? 'OPEN',
    createdAt,
    updatedAt: readString(item.updatedAt),
    reviewedAt: readString(item.reviewedAt) ?? null,
    reporter: buildUser(item.reporter),
    reviewedBy: buildUser(item.reviewedBy) ?? null,
    target: normalizeTarget(item.target),
  };
}

export async function createReport(payload: CreateReportPayload) {
  const response = await api<unknown>('/reports', {
    method: 'POST',
    body: payload,
  });

  const report = normalizeReport(asRecord(response)?.report);
  if (!report) {
    throw new Error('Signalement invalide renvoye par le backend.');
  }

  return report;
}

export async function getAdminReports(params?: {
  status?: ReportStatus | '';
}): Promise<ReportItem[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await api<unknown>(`/reports${suffix}`);
  const items = asArray(asRecord(response)?.reports);

  return items
    .map(normalizeReport)
    .filter((report): report is ReportItem => Boolean(report));
}

export async function updateReportStatus(
  reportId: number,
  status: ReportStatus,
) {
  const response = await api<unknown>(`/reports/${reportId}/status`, {
    method: 'PATCH',
    body: { status },
  });

  const report = normalizeReport(asRecord(response)?.report);
  if (!report) {
    throw new Error('Mise a jour du signalement invalide.');
  }

  return report;
}

export function deleteReportedTarget(reportId: number) {
  return api<{ deleted: boolean; report?: unknown }>(
    `/reports/${reportId}/target`,
    {
      method: 'DELETE',
    },
  );
}
