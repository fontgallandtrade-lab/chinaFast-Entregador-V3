import React, {
  useEffect,
} from 'react';

import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import * as Notifications
  from 'expo-notifications';

import LoginScreen from '../screens/LoginScreen';
import RegisterDriverScreen from '../screens/RegisterDriverScreen';
import DriverDocumentsScreen from '../screens/DriverDocumentsScreen';
import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import OrderScreen from '../screens/OrderScreen';
import PickupScreen from '../screens/PickupScreen';
import ValidatePickupScreen from '../screens/ValidatePickupScreen';
import PickupValidatedScreen from '../screens/PickupValidatedScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import ValidateDeliveryScreen from '../screens/ValidateDeliveryScreen';
import SuccessScreen from '../screens/SuccessScreen';

import type {
  RootStackParamList,
} from '../types/navigation';

const Stack =
  createNativeStackNavigator<
    RootStackParamList
  >();

export const navigationRef =
  createNavigationContainerRef<
    RootStackParamList
  >();

const navigationTheme = {
  ...DefaultTheme,

  colors: {
    ...DefaultTheme.colors,

    background:
      '#F3F5F7',
  },
};

function handleNotificationNavigation(
  response:
    Notifications.NotificationResponse,
) {
  const data =
    response.notification.request
      .content.data;

  const type =
    String(
      data?.type || '',
    );

  if (!navigationRef.isReady()) {
    return;
  }

  if (
    type ===
      'driver_document_rejected' ||
    type ===
      'driver_documents_rejected'
  ) {
    navigationRef.reset({
      index: 0,

      routes: [
        {
          name:
            'DriverDocuments',
        },
      ],
    });

    return;
  }

  if (
    type ===
    'driver_approved'
  ) {
    navigationRef.reset({
      index: 0,

      routes: [
        {
          name:
            'Home',
        },
      ],
    });
  }
}

export default function AppNavigator() {
  useEffect(() => {
    const subscription =
      Notifications
        .addNotificationResponseReceivedListener(
          response => {
            handleNotificationNavigation(
              response,
            );
          },
        );

    Notifications
      .getLastNotificationResponseAsync()
      .then(response => {
        if (response) {
          setTimeout(() => {
            handleNotificationNavigation(
              response,
            );
          }, 700);
        }
      })
      .catch(error => {
        console.log(
          '[push] Não foi possível ler a última notificação:',
          error,
        );
      });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer
      ref={
        navigationRef
      }
      theme={
        navigationTheme
      }
    >
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShadowVisible:
            false,

          headerStyle: {
            backgroundColor:
              '#F3F5F7',
          },

          headerTitleStyle: {
            fontWeight:
              '800',
          },

          headerTintColor:
            '#171717',

          animation:
            'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Login"
          component={
            LoginScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="RegisterDriver"
          component={
            RegisterDriverScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="DriverDocuments"
          component={
            DriverDocumentsScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="Home"
          component={
            HomeScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="Wallet"
          component={
            WalletScreen
          }
          options={{
            title:
              'Carteira',
          }}
        />

        <Stack.Screen
          name="Order"
          component={
            OrderScreen
          }
          options={{
            title:
              'Detalhes do pedido',
          }}
        />

        <Stack.Screen
          name="Pickup"
          component={
            PickupScreen
          }
          options={{
            title:
              'Retirada',
          }}
        />

        <Stack.Screen
          name="ValidatePickup"
          component={
            ValidatePickupScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="PickupValidated"
          component={
            PickupValidatedScreen
          }
          options={{
            headerShown:
              false,

            gestureEnabled:
              false,
          }}
        />

        <Stack.Screen
          name="Delivery"
          component={
            DeliveryScreen
          }
          options={{
            title:
              'Entrega',

            headerBackVisible:
              false,
          }}
        />

        <Stack.Screen
          name="ValidateDelivery"
          component={
            ValidateDeliveryScreen
          }
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="Success"
          component={
            SuccessScreen
          }
          options={{
            headerShown:
              false,

            gestureEnabled:
              false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
