export type AuthUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'driver' | 'customer' | 'company' | 'admin';
  status: string;

  driver_id?: number;
  approval_status?: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
};
