import type { User } from '@/type/user';

export type ProfileFormState = {
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  bio: string;
  isProfilePublic: boolean;
  isPrenomPublic: boolean;
  isEmailPublic: boolean;
  isBioPublic: boolean;
  displayColor: string;
  theme: string;
};

export type ProfileEditorTab = 'profile' | 'privacy';

export type ProfileTextField =
  | 'nom'
  | 'prenom'
  | 'pseudo'
  | 'email'
  | 'bio'
  | 'displayColor'
  | 'theme';

export type ProfileVisibilityField =
  | 'isProfilePublic'
  | 'isPrenomPublic'
  | 'isEmailPublic'
  | 'isBioPublic';

export const THEME_COLOR_PRESETS = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
  '#22c55e',
  '#eab308',
];

export const dialogPaperSx = {
  maxHeight: 'calc(100dvh - 48px)',
  overscrollBehavior: 'contain',
};

export const dialogContentSx = {
  overscrollBehavior: 'contain',
};

export function buildProfileFormState(user?: User | null): ProfileFormState {
  return {
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    pseudo: user?.pseudo ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? '',
    isProfilePublic: user?.isProfilePublic ?? true,
    isPrenomPublic: user?.isPrenomPublic ?? true,
    isEmailPublic: user?.isEmailPublic ?? false,
    isBioPublic: user?.isBioPublic ?? true,
    displayColor: user?.displayColor ?? '',
    theme: user?.theme ?? 'LIGHT',
  };
}

export function getProfileDisplayName(user?: User | null) {
  const fullName = [user?.prenom?.trim(), user?.nom?.trim()]
    .filter(Boolean)
    .join(' ');

  if (fullName) return fullName;
  if (user?.pseudo?.trim()) return user.pseudo.trim();
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email?.trim()) return user.email.trim();
  return 'Mon profil';
}

function getFollowerStorageKey(userId: string) {
  return `profile_known_followers_${userId}`;
}

export function readKnownFollowers(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getFollowerStorageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function writeKnownFollowers(userId: string, followerIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    getFollowerStorageKey(userId),
    JSON.stringify(followerIds),
  );
}

export function hasProfileChanged(
  currentProfile?: User | null,
  sessionUser?: User | null,
) {
  if (!currentProfile || !sessionUser) return true;

  return (
    currentProfile.updatedAt !== sessionUser.updatedAt ||
    currentProfile.isProfilePublic !== sessionUser.isProfilePublic ||
    currentProfile.isPrenomPublic !== sessionUser.isPrenomPublic ||
    currentProfile.isEmailPublic !== sessionUser.isEmailPublic ||
    currentProfile.isBioPublic !== sessionUser.isBioPublic ||
    currentProfile.avatarUrl !== sessionUser.avatarUrl ||
    currentProfile.bio !== sessionUser.bio ||
    currentProfile.displayColor !== sessionUser.displayColor ||
    currentProfile.theme !== sessionUser.theme ||
    currentProfile.nom !== sessionUser.nom ||
    currentProfile.prenom !== sessionUser.prenom ||
    currentProfile.pseudo !== sessionUser.pseudo ||
    currentProfile.email !== sessionUser.email
  );
}
