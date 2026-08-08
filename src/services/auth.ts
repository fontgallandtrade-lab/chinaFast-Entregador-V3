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

export type DriverRegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;

  document_number: string;
  cnh_number: string;
  cnh_expiration: string;

  vehicle_type:
    | 'motorcycle'
    | 'car'
    | 'van'
    | 'bicycle';

  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  vehicle_year:
    | number
    | null;
};

export type DriverRegisterResponse = {
  success: boolean;
  message: string;

  token: string;

  user: AuthUser & {
    approval_status?: string;
  };

  driver: {
    id: number;
    approval_status: string;
  };

  vehicle: {
    id: number;
    plate: string;
    document_status: string;
  };
};

async function login(
  credentials:
    LoginCredentials,
): Promise<LoginResponse> {
  const response =
    await apiRequest<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        authenticated: false,

        body:
          JSON.stringify({
            email:
              credentials.email
                .trim()
                .toLowerCase(),

            password:
              credentials.password,
          }),
      },
    );

  if (
    response.user.role !==
    'driver'
  ) {
    throw new Error(
      'Esta conta não pertence a um entregador.',
    );
  }

  if (
    !response.user.driver_id
  ) {
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

async function registerDriver(
  data: DriverRegisterData,
): Promise<DriverRegisterResponse> {
  const response =
    await apiRequest<
      DriverRegisterResponse
    >(
      '/auth/driver/register',
      {
        method: 'POST',
        authenticated: false,

        body:
          JSON.stringify({
            name:
              data.name.trim(),

            email:
              data.email
                .trim()
                .toLowerCase(),

            phone:
              data.phone.trim(),

            password:
              data.password,

            document_number:
              data.document_number,

            cnh_number:
              data.cnh_number,

            cnh_expiration:
              data.cnh_expiration,

            vehicle_type:
              data.vehicle_type,

            vehicle_brand:
              data.vehicle_brand
                .trim(),

            vehicle_model:
              data.vehicle_model
                .trim(),

            vehicle_color:
              data.vehicle_color
                .trim(),

            vehicle_plate:
              data.vehicle_plate
                .trim()
                .toUpperCase(),

            vehicle_year:
              data.vehicle_year,
          }),
      },
    );

  await saveSession(
    response.token,
    response.user,
  );

  return response;
}

async function logout():
Promise<void> {
  await clearSession();
}

async function getSession(): Promise<{
  token: string;
  user: AuthUser;
} | null> {
  const [
    token,
    user,
  ] =
    await Promise.all([
      getToken(),
      getStoredUser<AuthUser>(),
    ]);

  if (
    !token ||
    !user
  ) {
    return null;
  }

  return {
    token,
    user,
  };
}

export const authService = {
  login,
  registerDriver,
  logout,
  getSession,
};
