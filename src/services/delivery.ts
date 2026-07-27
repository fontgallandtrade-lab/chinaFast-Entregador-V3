import { apiRequest } from './api';

import type {
  AcceptDeliveryResponse,
  AvailableDeliveriesResponse,
  Delivery,
} from '../types/delivery';

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

async function getMine(): Promise<any> {
  return apiRequest(
    '/driver/deliveries/my',
  );
}

async function confirmPickup(
  deliveryId: number,
  code: string,
): Promise<any> {
  return apiRequest(
    `/driver/deliveries/${deliveryId}/confirm-pickup`,
    {
      method: 'POST',
      body: JSON.stringify({
        code,
      }),
    },
  );
}

async function confirmDelivery(
  deliveryId: number,
  code: string,
): Promise<any> {
  return apiRequest(
    `/driver/deliveries/${deliveryId}/confirm-delivery`,
    {
      method: 'POST',
      body: JSON.stringify({
        code,
      }),
    },
  );
}

export const deliveryService = {
  getAvailable,
  accept,
  getMine,
  confirmPickup,
  confirmDelivery,
};
