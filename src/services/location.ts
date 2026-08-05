import * as Location from 'expo-location';

import {
  connectDriverSocket,
} from './socket';

let locationSubscription:
  Location.LocationSubscription | null = null;

let activeDeliveryId: number | null = null;
let activeDriverId: number | null = null;

type StartTrackingParams = {
  driverId: number;
  deliveryId: number;
};

export async function startDriverLocationTracking({
  driverId,
  deliveryId,
}: StartTrackingParams): Promise<void> {
  if (!driverId || !deliveryId) {
    throw new Error(
      'Entregador e entrega são obrigatórios para iniciar o rastreamento.',
    );
  }

  await stopDriverLocationTracking();

  const foregroundPermission =
    await Location.requestForegroundPermissionsAsync();

  if (
    foregroundPermission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    throw new Error(
      'Permissão de localização não concedida.',
    );
  }

  const servicesEnabled =
    await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    throw new Error(
      'Ative o GPS do celular para compartilhar sua localização.',
    );
  }

  activeDriverId = driverId;
  activeDeliveryId = deliveryId;

  locationSubscription =
    await Location.watchPositionAsync(
      {
        accuracy:
          Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      location => {
        const latitude =
          location.coords.latitude;

        const longitude =
          location.coords.longitude;

        if (!activeDriverId) {
          return;
        }

        const socket =
          connectDriverSocket(activeDriverId);

        if (!socket.connected) {
          console.log(
            '[location] Socket desconectado. Localização não enviada.',
          );

          return;
        }

        socket.emit(
          'driver-location',
          {
            driverId: activeDriverId,
            deliveryId: activeDeliveryId,
            latitude,
            longitude,
            accuracy:
              location.coords.accuracy,
            heading:
              location.coords.heading,
            speed:
              location.coords.speed,
            timestamp:
              location.timestamp,
          },
        );

        console.log(
          '[location] Localização enviada:',
          {
            deliveryId:
              activeDeliveryId,
            latitude,
            longitude,
          },
        );
      },
    );

  console.log(
    '[location] Rastreamento iniciado:',
    {
      driverId,
      deliveryId,
    },
  );
}

export async function stopDriverLocationTracking():
Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  activeDriverId = null;
  activeDeliveryId = null;

  console.log(
    '[location] Rastreamento encerrado.',
  );
}

export function isDriverLocationTracking():
boolean {
  return locationSubscription !== null;
}
