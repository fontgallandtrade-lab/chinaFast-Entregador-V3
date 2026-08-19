import { apiRequest } from './api';

import type {
  AcceptDeliveryResponse,
  AvailableDeliveriesResponse,
  Delivery,
} from '../types/delivery';

type MyDeliveriesResponse = {
  success: boolean;
  total: number;
  deliveries: Delivery[];
};

type StatusResponse = {
  success: boolean;
  message: string;
  status: string;
};

type PositionData = {
  latitude?: number | null;
  longitude?: number | null;
};

async function getAvailable(): Promise<Delivery[]> {
  const response =
    await apiRequest<AvailableDeliveriesResponse>(
      '/driver/deliveries/available',
    );

  return response.deliveries || [];
}

async function accept(
  deliveryId: number,
): Promise<AcceptDeliveryResponse> {
  return apiRequest<AcceptDeliveryResponse>(
    `/driver/deliveries/${deliveryId}/accept`,
    {
      method: 'POST',
    },
  );
}

async function reject(
  deliveryId: number,
): Promise<StatusResponse> {
  return apiRequest<StatusResponse>(
    `/driver/deliveries/${deliveryId}/reject`,
    {
      method: 'POST',
    },
  );
}

async function getMine(): Promise<Delivery[]> {
  const response =
    await apiRequest<MyDeliveriesResponse>(
      '/driver/deliveries/my',
    );

  return response.deliveries || [];
}

async function getById(
  deliveryId: number,
): Promise<Delivery> {
  const deliveries = await getMine();

  const delivery = deliveries.find(
    item => Number(item.id) === Number(deliveryId),
  );

  if (!delivery) {
    throw new Error(
      'Não foi possível localizar esta corrida.',
    );
  }

  return delivery;
}

async function updateStatus(
  deliveryId: number,
  status: string,
  position: PositionData = {},
): Promise<StatusResponse> {
  return apiRequest<StatusResponse>(
    `/driver/deliveries/${deliveryId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        latitude: position.latitude ?? null,
        longitude: position.longitude ?? null,
      }),
    },
  );
}

async function confirmPickup(
  deliveryId: number,
  code: string,
  position: PositionData = {},
): Promise<StatusResponse> {
  return apiRequest<StatusResponse>(
    `/driver/deliveries/${deliveryId}/confirm-pickup`,
    {
      method: 'POST',
      body: JSON.stringify({
        pickup_code: code,
        latitude: position.latitude ?? null,
        longitude: position.longitude ?? null,
      }),
    },
  );
}

async function confirmDelivery(
  deliveryId: number,
  code: string,
  position: PositionData = {},
): Promise<any> {
  return apiRequest(
    `/driver/deliveries/${deliveryId}/confirm-delivery`,
    {
      method: 'POST',
      body: JSON.stringify({
        delivery_code: code,
        latitude: position.latitude ?? null,
        longitude: position.longitude ?? null,
      }),
    },
  );
}

export const deliveryService = {
  getAvailable,
  accept,
  reject,
  getMine,
  getById,
  updateStatus,
  confirmPickup,
  confirmDelivery,
};
