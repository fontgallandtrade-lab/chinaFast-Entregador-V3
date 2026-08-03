import {
  apiRequest,
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from './api';

import type {
  AuthUser,
  LoginResponse,
} from '../types/auth';

type LoginCredentials = {
  email: string;
  password: string;
};

async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response =
    await apiRequest<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        authenticated: false,
        body: JSON.stringify({
          email: credentials.email
            .trim()
            .toLowerCase(),
          password: credentials.password,
        }),
      },
    );

  if (response.user.role !== 'driver') {
    throw new Error(
      'Esta conta não pertence a um entregador.',
    );
  }

  if (!response.user.driver_id) {
    throw new Error(
      'O cadastro do entregador não possui identificação válida.',
    );
  }

  await saveSession(
    response.token,
    response.user,
  );

  return response;
}

async function logout(): Promise<void> {
  await clearSession();
}

async function getSession(): Promise<{
  token: string;
  user: AuthUser;
} | null> {
  const [token, user] = await Promise.all([
    getToken(),
    getStoredUser<AuthUser>(),
  ]);

  if (!token || !user) {
    return null;
  }

  return {
    token,
    user,
  };
}

export const authService = {
  login,
  logout,
  getSession,
};
