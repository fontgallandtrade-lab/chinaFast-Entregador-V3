import * as Location from 'expo-location';

import type {
  Socket,
} from 'socket.io-client';

import {
  connectDriverSocket,
} from './socket';

let locationSubscription:
  Location.LocationSubscription | null = null;

let trackingSocket: Socket | null = null;

let activeDeliveryId: number | null = null;
let activeDriverId: number | null = null;

type StartTrackingParams = {
  driverId: number;
  deliveryId: number;
};

function emitLocation(
  location: Location.LocationObject,
): void {
  if (
    !trackingSocket ||
    !activeDriverId ||
    !activeDeliveryId
  ) {
    return;
  }

  const payload = {
    driverId: activeDriverId,
    deliveryId: activeDeliveryId,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    heading: location.coords.heading,
    speed: location.coords.speed,
    timestamp: location.timestamp,
  };

  if (trackingSocket.connected) {
    trackingSocket.emit(
      'driver-location',
      payload,
    );

    console.log(
      '[location] Localização enviada:',
      payload,
    );

    return;
  }

  console.log(
    '[location] Socket conectando. Localização aguardando envio.',
  );

  trackingSocket.once(
    'connect',
    () => {
      trackingSocket?.emit(
        'driver-location',
        payload,
      );

      console.log(
        '[location] Localização enviada após conectar:',
        payload,
      );
    },
  );

  trackingSocket.connect();
}

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

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (
    permission.status !==
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

  trackingSocket =
    connectDriverSocket(driverId);

  console.log(
    '[location] Obtendo posição inicial...',
  );

  try {
    const initialLocation =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });

    emitLocation(initialLocation);
  } catch (error) {
    console.log(
      '[location] Falha ao obter posição inicial:',
      error instanceof Error
        ? error.message
        : error,
    );
  }

  locationSubscription =
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
        mayShowUserSettingsDialog: true,
      },
      location => {
        emitLocation(location);
      },
      reason => {
        console.log(
          '[location] Erro no monitoramento:',
          reason,
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

  trackingSocket = null;
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
