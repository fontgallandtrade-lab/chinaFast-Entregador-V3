import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  deliveryService,
} from '../services/delivery';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Order'
>;

function formatCurrency(
  value: number,
): string {
  return Number(value || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  );
}

function formatDistance(
  value: number,
): string {
  return `${Number(value || 0).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    },
  )} km`;
}

function formatFullAddress(
  street?: string | null,
  number?: string | null,
  neighborhood?: string | null,
  city?: string | null,
  state?: string | null,
): string {
  const streetLine = [
    street,
    number,
  ]
    .filter(Boolean)
    .join(', ');

  const locationLine = [
    neighborhood,
    city,
    state,
  ]
    .filter(Boolean)
    .join(' - ');

  return [
    streetLine,
    locationLine,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function OrderScreen({
  route,
  navigation,
}: Props) {
  const { delivery } = route.params;

  const [accepting, setAccepting] =
    useState(false);

  const isIntercity =
    delivery.delivery_type ===
    'intercity';

  async function handleAccept() {
    if (accepting) {
      return;
    }

    try {
      setAccepting(true);

      await deliveryService.accept(
        delivery.id,
      );

      navigation.replace('Pickup', {
        orderId: delivery.id,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível aceitar a corrida.';

      Alert.alert(
        'Corrida não aceita',
        message,
      );
    } finally {
      setAccepting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.typeBadge,
            isIntercity
              ? styles.intercityBadge
              : styles.urbanBadge,
          ]}
        >
          <Text style={styles.typeBadgeText}>
            {isIntercity
              ? 'ENTREGA INTERMUNICIPAL'
              : 'ENTREGA URBANA'}
          </Text>
        </View>

        <Text style={styles.title}>
          {delivery.public_code ||
            `Pedido #${delivery.id}`}
        </Text>

        <View style={styles.routeCard}>
          <Text style={styles.sectionLabel}>
            RETIRADA
          </Text>

          <Text style={styles.city}>
            {delivery.pickup_city}
          </Text>

          <Text style={styles.address}>
            {formatFullAddress(
              delivery.pickup_street,
              delivery.pickup_number,
              delivery.pickup_neighborhood,
              delivery.pickup_city,
              delivery.pickup_state,
            )}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>
            ENTREGA
          </Text>

          <Text style={styles.city}>
            {delivery.destination_city}
          </Text>

          <Text style={styles.address}>
            {formatFullAddress(
              delivery.destination_street,
              delivery.destination_number,
              delivery.destination_neighborhood,
              delivery.destination_city,
              delivery.destination_state,
            )}
          </Text>
        </View>

        <View style={styles.distanceCard}>
          <View style={styles.distanceRow}>
            <Text style={styles.distanceLabel}>
              Distância de ida
            </Text>

            <Text style={styles.distanceValue}>
              {formatDistance(
                delivery
                  .distance_outbound_km,
              )}
            </Text>
          </View>

          {isIntercity && (
            <View style={styles.distanceRow}>
              <Text
                style={styles.distanceLabel}
              >
                Distância de retorno
              </Text>

              <Text
                style={styles.distanceValue}
              >
                {formatDistance(
                  delivery
                    .distance_return_km,
                )}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.distanceRow,
              styles.totalDistanceRow,
            ]}
          >
            <Text
              style={styles.totalDistanceLabel}
            >
              Distância total
            </Text>

            <Text
              style={styles.totalDistanceValue}
            >
              {formatDistance(
                delivery.distance_total_km,
              )}
            </Text>
          </View>
        </View>

        {delivery.package_type ||
        delivery.package_description ? (
          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>
              Informações da encomenda
            </Text>

            {delivery.package_type ? (
              <Text style={styles.packageText}>
                Tipo: {delivery.package_type}
              </Text>
            ) : null}

            {delivery.package_description ? (
              <Text style={styles.packageText}>
                {delivery.package_description}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.paymentCard}>
          <Text style={styles.paymentLabel}>
            VALOR DA CORRIDA
          </Text>

          <Text style={styles.paymentValue}>
            {formatCurrency(
              delivery.driver_amount,
            )}
          </Text>
        </View>

        {delivery
          .estimated_duration_minutes ? (
          <Text style={styles.estimatedTime}>
            Tempo estimado:{' '}
            {
              delivery
                .estimated_duration_minutes
            } minutos
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.acceptButton,
            accepting &&
              styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.acceptButtonText}
            >
              ACEITAR ENTREGA
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.rejectButton}
          onPress={() =>
            navigation.goBack()
          }
          disabled={accepting}
        >
          <Text
            style={styles.rejectButtonText}
          >
            RECUSAR
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
  },

  urbanBadge: {
    backgroundColor: '#228B4E',
  },

  intercityBadge: {
    backgroundColor: '#FF6A00',
  },

  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  title: {
    color: '#171717',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },

  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 3,
  },

  sectionLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '900',
  },

  city: {
    color: '#202020',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },

  address: {
    color: '#707070',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 20,
  },

  distanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
  },

  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },

  distanceLabel: {
    color: '#6C6C6C',
    fontSize: 14,
  },

  distanceValue: {
    color: '#242424',
    fontSize: 15,
    fontWeight: '900',
  },

  totalDistanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    marginTop: 9,
    paddingTop: 13,
  },

  totalDistanceLabel: {
    color: '#242424',
    fontSize: 14,
    fontWeight: '900',
  },

  totalDistanceValue: {
    color: '#FF6A00',
    fontSize: 17,
    fontWeight: '900',
  },

  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
  },

  packageTitle: {
    color: '#202020',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },

  packageText: {
    color: '#707070',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },

  paymentCard: {
    backgroundColor: '#EAF8EF',
    borderRadius: 20,
    padding: 22,
    marginTop: 15,
  },

  paymentLabel: {
    color: '#50735B',
    fontSize: 12,
    fontWeight: '900',
  },

  paymentValue: {
    color: '#188642',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },

  estimatedTime: {
    color: '#737373',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },

  acceptButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  acceptButtonDisabled: {
    opacity: 0.65,
  },

  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  rejectButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  rejectButtonText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '900',
  },
});
