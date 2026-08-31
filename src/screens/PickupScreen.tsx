import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  deliveryService,
} from '../services/delivery';

import type { Delivery } from '../types/delivery';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Pickup'
>;

function formatAddress(
  delivery: Delivery,
): string {
  return [
    [
      delivery.pickup_street,
      delivery.pickup_number,
    ].filter(Boolean).join(', '),

    [
      delivery.pickup_neighborhood,
      delivery.pickup_city,
    ].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join('\n');
}

export default function PickupScreen({
  route,
  navigation,
}: Props) {
  const { orderId } = route.params;

  const insets = useSafeAreaInsets();

  const [delivery, setDelivery] =
    useState<Delivery | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

  const navigationOpenedRef =
    useRef(false);

  const appStateRef =
    useRef(AppState.currentState);

  const loadDelivery = useCallback(
    async () => {
      try {
        setLoading(true);

        const result =
          await deliveryService.getById(
            orderId,
          );

        setDelivery(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a retirada.';

        Alert.alert('Erro', message);
      } finally {
        setLoading(false);
      }
    },
    [orderId],
  );

  useFocusEffect(
    useCallback(() => {
      loadDelivery();
    }, [loadDelivery]),
  );

  useEffect(() => {
    if (!delivery) {
      return;
    }

    if (
      delivery.status !== 'accepted'
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void openPickupRoute();
    }, 600);

    return () => {
      clearTimeout(timer);
    };
  }, [delivery?.id, delivery?.status]);

  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        nextState => {
          const previousState =
            appStateRef.current;

          appStateRef.current =
            nextState;

          const returnedToApp =
            (
              previousState === 'background' ||
              previousState === 'inactive'
            ) &&
            nextState === 'active';

          if (
            returnedToApp &&
            navigationOpenedRef.current
          ) {
            navigationOpenedRef.current = false;

            setTimeout(() => {
              Alert.alert(
                'Chegou à coleta?',
                'Se você já está no local, confirme sua chegada para continuar.',
                [
                  {
                    text: 'Ainda não',
                    style: 'cancel',
                  },
                  {
                    text: 'CHEGUEI',
                    onPress: arrivedAtPickup,
                  },
                ],
              );
            }, 400);
          }
        },
      );

    return () => {
      subscription.remove();
    };
  });

  async function beginPickupRoute() {
    if (!delivery || updating) {
      return;
    }

    try {
      setUpdating(true);

      if (delivery.status === 'accepted') {
        await deliveryService.updateStatus(
          orderId,
          'driver_going_to_pickup',
        );
      }

      await loadDelivery();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a rota.';

      Alert.alert('Erro', message);
    } finally {
      setUpdating(false);
    }
  }

  async function arrivedAtPickup() {
    if (!delivery || updating) {
      return;
    }

    try {
      setUpdating(true);

      if (
        delivery.status ===
        'driver_going_to_pickup'
      ) {
        await deliveryService.updateStatus(
          orderId,
          'arrived_at_pickup',
        );
      }

      navigation.navigate(
        'ValidatePickup',
        {
          orderId,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível confirmar a chegada.';

      Alert.alert('Erro', message);
    } finally {
      setUpdating(false);
    }
  }

  async function openPickupRoute() {
    if (!delivery || updating) {
      return;
    }

    try {
      if (delivery.status === 'accepted') {
        setUpdating(true);

        await deliveryService.updateStatus(
          orderId,
          'driver_going_to_pickup',
        );

        await loadDelivery();
      }

      navigationOpenedRef.current = true;
    } catch (error) {
      navigationOpenedRef.current = false;

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a rota.';

      Alert.alert('Erro', message);
      setUpdating(false);
      return;
    } finally {
      setUpdating(false);
    }

    const addressDestination = [
      delivery.pickup_street,
      delivery.pickup_number,
      delivery.pickup_neighborhood,
      delivery.pickup_city,
      delivery.pickup_state,
      'Brasil',
    ]
      .filter(Boolean)
      .join(', ');

    const hasAddress =
      Boolean(delivery.pickup_street) &&
      Boolean(delivery.pickup_city);

    const hasCoordinates =
      delivery.pickup_latitude !== null &&
      delivery.pickup_latitude !== undefined &&
      delivery.pickup_longitude !== null &&
      delivery.pickup_longitude !== undefined;

    const destination = hasAddress
      ? addressDestination
      : hasCoordinates
        ? `${delivery.pickup_latitude},${delivery.pickup_longitude}`
        : '';

    if (!destination) {
      Alert.alert(
        'Endereço de coleta indisponível',
        'Não foi possível localizar um endereço ou coordenadas válidas para esta coleta.',
      );
      return;
    }

    const encodedDestination =
      encodeURIComponent(destination);

    const mapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${encodedDestination}` +
      `&travelmode=driving`;

    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert(
        'Não foi possível abrir o mapa',
        'Verifique se existe um aplicativo de mapas instalado.',
      );
    });
  }

  function openPhone() {
    const phone =
      delivery?.pickup_contact_phone;

    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#FF6A00"
        />

        <Text style={styles.loadingText}>
          Carregando retirada...
        </Text>
      </SafeAreaView>
    );
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>
          Corrida não localizada.
        </Text>
      </SafeAreaView>
    );
  }

  const routeStarted =
    delivery.status !== 'accepted';

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingBottom: Math.max(
              insets.bottom + 24,
              48,
            ),
          },
        ]}
      >
        <Text style={styles.title}>
          Ir até a retirada
        </Text>

        <Text style={styles.code}>
          {delivery.public_code}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            RESPONSÁVEL PELA RETIRADA
          </Text>

          <Text style={styles.name}>
            {delivery.pickup_contact_name ||
              'Responsável pela retirada'}
          </Text>

          <Text style={styles.address}>
            {formatAddress(delivery)}
          </Text>

          <TouchableOpacity
            style={styles.mapsButton}
            activeOpacity={0.85}
            onPress={openPickupRoute}
          >
            <Text style={styles.mapsButtonText}>
              ABRIR ROTA NO GOOGLE MAPS
            </Text>
          </TouchableOpacity>

          {delivery.pickup_contact_phone ? (
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={openPhone}
            >
              <Text style={styles.phoneText}>
                LIGAR PARA O RESPONSÁVEL
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!routeStarted ? (
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            disabled={updating}
            onPress={beginPickupRoute}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                INICIAR ROTA PARA RETIRADA
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            disabled={updating}
            onPress={arrivedAtPickup}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                CHEGUEI PARA COLETA
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },

  center: {
    flex: 1,
    backgroundColor: '#F3F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: '#666666',
    marginTop: 14,
  },

  errorText: {
    color: '#A72B2B',
    fontSize: 17,
    fontWeight: '800',
  },

  content: {
    flex: 1,
    padding: 22,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171717',
  },

  code: {
    marginTop: 8,
    color: '#777777',
    fontSize: 15,
  },

  card: {
    marginTop: 30,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  label: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '800',
  },

  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6A00',
  },

  address: {
    marginTop: 9,
    color: '#555555',
    fontSize: 15,
    lineHeight: 22,
  },

  mapsButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  mapsButtonText: {
    color: '#1769AA',
    fontWeight: '900',
    fontSize: 13,
  },

  phoneButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF0E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  phoneText: {
    color: '#D85A00',
    fontWeight: '900',
    fontSize: 13,
  },

  button: {
    height: 62,
    backgroundColor: '#FF6A00',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
