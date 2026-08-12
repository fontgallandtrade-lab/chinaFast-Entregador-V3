import {
  apiRequest,
} from './api';

export type DriverProfile = {
  id: number;
  user_id: number;
  approval_status: string;
  online: boolean;
  rating: number;
  name: string;
  email: string;
  phone?: string | null;
  user_status?: string | null;
};

async function getProfile():
Promise<DriverProfile> {
  const response =
    await apiRequest<{
      success: boolean;
      driver: DriverProfile;
    }>('/driver/me');

  return response.driver;
}

export const profileService = {
  getProfile,
};
