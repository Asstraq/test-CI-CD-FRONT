type PublicUserSource = {
  id?: unknown;
  userId?: unknown;
  nom?: unknown;
  prenom?: unknown;
  pseudo?: unknown;
  email?: unknown;
  avatarUrl?: unknown;
  bio?: unknown;
  role?: unknown;
  theme?: unknown;
  displayColor?: unknown;
  isProfilePublic?: unknown;
  isPrenomPublic?: unknown;
  isEmailPublic?: unknown;
  isBioPublic?: unknown;
  _count?: {
    followers?: unknown;
  } | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type BuildPublicUserIdentityOptions = {
  fallbackId?: string;
};

export type PublicUser = {
  id: number | null;
  nom: string;
  prenom: string | null;
  pseudo: string | null;
  avatarUrl: string | null;
  bio: string | null;
  email: string | null;
  role: 'USER' | 'ADMIN' | null;
  theme: 'LIGHT' | 'DARK' | null;
  displayColor: string | null;
  isProfilePublic: boolean | null;
  isPrenomPublic: boolean | null;
  isEmailPublic: boolean | null;
  isBioPublic: boolean | null;
  followersCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PublicUserIdentity = {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl: string;
  theme?: string;
  displayColor?: string;
};

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readId(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function readEnum<T extends string>(
  allowed: readonly T[],
  ...values: unknown[]
): T | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (allowed.includes(normalized as T)) return normalized as T;
    }
  }
  return undefined;
}

function readDateString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readFollowersCount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toHandle(value: string): string {
  return value.startsWith('@')
    ? value
    : `@${value.replace(/\s+/g, '').toLowerCase()}`;
}

export function buildPublicUser(user?: PublicUserSource | null): PublicUser {
  return {
    id: readId(user?.id, user?.userId) ?? null,
    nom: readString(user?.nom) || '',
    prenom: readString(user?.prenom) || null,
    pseudo: readString(user?.pseudo) || null,
    avatarUrl: readString(user?.avatarUrl) || null,
    bio: readString(user?.bio) || null,
    email: readString(user?.email) || null,
    role: readEnum(['USER', 'ADMIN'] as const, user?.role) || null,
    theme: readEnum(['LIGHT', 'DARK'] as const, user?.theme) || null,
    displayColor: readString(user?.displayColor) || null,
    isProfilePublic: readBoolean(user?.isProfilePublic) ?? null,
    isPrenomPublic: readBoolean(user?.isPrenomPublic) ?? null,
    isEmailPublic: readBoolean(user?.isEmailPublic) ?? null,
    isBioPublic: readBoolean(user?.isBioPublic) ?? null,
    followersCount: readFollowersCount(user?._count?.followers) ?? null,
    createdAt: readDateString(user?.createdAt) || null,
    updatedAt: readDateString(user?.updatedAt) || null,
  };
}

export function buildPublicUserIdentity(
  input?: PublicUserSource | null,
  options: BuildPublicUserIdentityOptions = {},
): PublicUserIdentity {
  const user = buildPublicUser(input);
  const fullName = [user.prenom, user.nom].filter(Boolean).join(' ');
  const name = fullName || user.nom || user.pseudo || 'Utilisateur';
  const handleBase =
    user.pseudo || user.nom || options.fallbackId || 'utilisateur';
  const normalizedId =
    user.id && user.id > 0 ? String(user.id) : options.fallbackId;

  return {
    id: normalizedId || 'unknown-user',
    email: user.email || '',
    name,
    handle: toHandle(handleBase),
    avatarUrl: user.avatarUrl || '',
    theme: user.theme || undefined,
    displayColor: user.displayColor || undefined,
  };
}
