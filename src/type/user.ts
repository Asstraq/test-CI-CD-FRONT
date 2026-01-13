import { Role } from '@/enum/roles';

export type ResponseAPIUser = {
  user: {
    id?: string;
    email: string;
    role: Role;
    name?: string;
    avatarUrl?: URL;
    bio?: string;
  };
  token: string;
};
