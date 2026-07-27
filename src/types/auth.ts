export type UserRole =
  | 'customer'
  | 'company'
  | 'driver'
  | 'admin';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};
