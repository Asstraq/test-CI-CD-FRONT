import { Role } from '@/enum/roles';

export type User = {
  id?: string;
  email: string;
  role: Role;
  name?: string;
  avatarUrl?: URL;
  bio?: string;
};

export type ResponseAPIUser = {
  user: User;
  token: string;
};
