export const REPORT_TARGET_TYPES = ['REVIEW', 'MESSAGE'] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE',
  'NSFW',
  'VIOLENCE',
  'SCAM',
  'IMPERSONATION',
  'MISINFORMATION',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  'OPEN',
  'IN_REVIEW',
  'RESOLVED',
  'REJECTED',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type ReportUser = {
  id: string;
  name: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
  role?: string;
};

export type ReportTarget =
  | {
      kind: 'REVIEW';
      review: {
        id: number;
        content?: string | null;
        rating?: number | null;
        createdAt?: string;
        user?: ReportUser;
        media?: {
          title?: string;
          imageUrl?: string | null;
          spotifyId?: string;
          type?: string;
        };
      };
    }
  | {
      kind: 'MESSAGE';
      message: {
        id: number;
        content?: string | null;
        createdAt?: string;
        sender?: ReportUser;
        conversation?: {
          id: number;
          userA?: ReportUser;
          userB?: ReportUser;
        };
      };
    }
  | {
      kind: 'USER';
      user: ReportUser;
    }
  | {
      kind: 'REVIEW_COMMENT';
      reviewComment: {
        id: number;
        content?: string | null;
        createdAt?: string;
        user?: ReportUser;
      };
    }
  | {
      kind: 'LIST';
      list: {
        id: number;
        name?: string;
        isPublic?: boolean;
        createdAt?: string;
        user?: ReportUser;
      };
    };

export type ReportItem = {
  id: number;
  targetType: ReportTargetType | string;
  targetId: number;
  reason: ReportReason | string;
  details?: string | null;
  status: ReportStatus | string;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  reporter?: ReportUser;
  reviewedBy?: ReportUser | null;
  target?: ReportTarget | null;
};

export type CreateReportPayload = {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  details?: string;
};
