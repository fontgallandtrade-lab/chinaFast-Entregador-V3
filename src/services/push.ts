import { Platform } from 'react-native';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { apiRequest } from './api';

type SavePushTokenResponse = {
  success: boolean;
  message: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    'novas-corridas',
    {
      name: 'Novas corridas',
      description:
        'Notificações de novas entregas disponíveis',
      importance:
        Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      sound: 'default',
    },
  );
}

async function requestPermission(): Promise<boolean> {
  const current =
    await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested =
    await Notifications.requestPermissionsAsync();

  return requested.granted;
}

async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log(
      '[push] Token não registrado: não é dispositivo físico.',
    );

    return null;
  }

  await configureAndroidChannel();

  const permissionGranted =
    await requestPermission();

  if (!permissionGranted) {
    console.log(
      '[push] Permissão de notificações não concedida.',
    );

    return null;
  }

  const devicePushToken =
    await Notifications.getDevicePushTokenAsync();

  const token = String(
    devicePushToken.data || '',
  ).trim();

  if (!token) {
    throw new Error(
      'O Firebase não retornou um token válido.',
    );
  }

  await apiRequest<SavePushTokenResponse>(
    '/driver/push-token',
    {
      method: 'POST',
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    },
  );

  console.log(
    '[push] Token FCM registrado na API.',
  );

  return token;
}

export const pushService = {
  registerPushToken,
};
