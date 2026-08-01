import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

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
  'Delivery'
>;

function formatAddress(
  delivery: Delivery,
): string {
  return [
    [
      delivery.destination_street,
      delivery.destination_number,
    ].filter(Boolean).join(', '),

    [
      delivery.destination_neighborhood,
      delivery.destination_city,
    ].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join('\n');
}

export default function DeliveryScreen({
  route,
  navigation,
}: Props) {
  const { orderId } = route.params;

  const [delivery, setDelivery] =
    useState<Delivery | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [updating, setUpdating] =
    useState(false);

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
            : 'Não foi possível carregar a entrega.';

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

  async function arrivedAtDestination() {
    if (!delivery || updating) {
      return;
    }

    try {
      setUpdating(true);

      if (
        delivery.status === 'in_transit'
      ) {
        await deliveryService.updateStatus(
          orderId,
          'arrived_at_destination',
        );
      }

      navigation.navigate(
        'ValidateDelivery',
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

  function openDeliveryRoute() {
    if (!delivery) {
      return;
    }

    const destination = [
      delivery.destination_street,
      delivery.destination_number,
      delivery.destination_neighborhood,
      delivery.destination_city,
      delivery.destination_state,
    ]
      .filter(Boolean)
      .join(', ');

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
      delivery?.destination_contact_phone;

    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#188642"
        />

        <Text style={styles.loadingText}>
          Carregando entrega...
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Realizar entrega
        </Text>

        <Text style={styles.code}>
          {delivery.public_code}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            DESTINATÁRIO
          </Text>

          <Text style={styles.name}>
            {delivery.destination_contact_name ||
              'Destinatário'}
          </Text>

          <Text style={styles.address}>
            {formatAddress(delivery)}
          </Text>

          <TouchableOpacity
            style={styles.mapsButton}
            activeOpacity={0.85}
            onPress={openDeliveryRoute}
          >
            <Text style={styles.mapsButtonText}>
              ABRIR ROTA NO GOOGLE MAPS
            </Text>
          </TouchableOpacity>

          {delivery
            .destination_contact_phone ? (
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={openPhone}
            >
              <Text style={styles.phoneText}>
                LIGAR PARA O DESTINATÁRIO
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          disabled={updating}
          onPress={arrivedAtDestination}
        >
          {updating ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.buttonText}>
              CHEGUEI AO DESTINO
            </Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
  },

  label: {
    color: '#777777',
    fontWeight: '800',
    fontSize: 12,
  },

  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '900',
    color: '#222222',
  },

  address: {
    marginTop: 8,
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
    backgroundColor: '#EAF8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  phoneText: {
    color: '#188642',
    fontWeight: '900',
    fontSize: 13,
  },

  button: {
    height: 62,
    borderRadius: 18,
    backgroundColor: '#188642',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
