import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import OrderScreen from '../screens/OrderScreen';
import PickupScreen from '../screens/PickupScreen';
import DeliveryScreen from '../screens/DeliveryScreen';
import SuccessScreen from '../screens/SuccessScreen';
import type { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F3F5F7',
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#F3F5F7',
          },
          headerTitleStyle: {
            fontWeight: '800',
          },
          headerTintColor: '#171717',
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Order"
          component={OrderScreen}
          options={{
            title: 'Detalhes do pedido',
          }}
        />

        <Stack.Screen
          name="Pickup"
          component={PickupScreen}
          options={{
            title: 'Retirada',
          }}
        />

        <Stack.Screen
          name="Delivery"
          component={DeliveryScreen}
          options={{
            title: 'Entrega',
            headerBackVisible: false,
          }}
        />

        <Stack.Screen
          name="Success"
          component={SuccessScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
