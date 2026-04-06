import { Role } from '@/enum/roles';

export type User = {
  id?: string;
  email: string;
  role: Role;
  nom?: string;
  prenom?: string;
  pseudo?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  isProfilePublic?: boolean;
  isPrenomPublic?: boolean;
  isEmailPublic?: boolean;
  isBioPublic?: boolean;
  displayColor?: string;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ResponseAPIUser = {
  user: User;
  token: string;
};

export type UpdateProfilePayload = {
  nom?: string;
  prenom?: string;
  pseudo?: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string;
  isProfilePublic?: boolean;
  isPrenomPublic?: boolean;
  isEmailPublic?: boolean;
  isBioPublic?: boolean;
  displayColor?: string;
  theme?: string;
};
