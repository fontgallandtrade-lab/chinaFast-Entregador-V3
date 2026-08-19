import React, {
  useEffect,
  useRef,
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

import {
  authService,
} from '../services/auth';

import {
  routeAlertSound,
} from '../services/routeAlertSound';

import {
  getSocket,
} from '../services/socket';

import {
  startDriverLocationTracking,
} from '../services/location';

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

  const [rejecting, setRejecting] =
    useState(false);

  const acceptingRef = useRef(false);

  const isIntercity =
    delivery.delivery_type ===
    'intercity';

  useEffect(() => {
    const socket = getSocket();

    async function handleDeliveryStatusUpdated(
      payload: {
        deliveryId?: number;
        status?: string;
        driverId?: number;
      },
    ) {
      const updatedDeliveryId =
        Number(payload?.deliveryId);

      if (
        updatedDeliveryId !==
        Number(delivery.id)
      ) {
        return;
      }

      if (
        payload?.status !== 'accepted'
      ) {
        return;
      }

      // Se este aparelho acabou de aceitar,
      // não fechar a própria tela.
      if (acceptingRef.current) {
        return;
      }

      console.log(
        '[order] Corrida aceita por outro entregador:',
        updatedDeliveryId,
      );

      await routeAlertSound.stop();

      Alert.alert(
        'Corrida indisponível',
        'Outro entregador aceitou esta corrida primeiro.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        {
          cancelable: false,
        },
      );
    }

    socket.on(
      'delivery-status-updated',
      handleDeliveryStatusUpdated,
    );

    return () => {
      socket.off(
        'delivery-status-updated',
        handleDeliveryStatusUpdated,
      );
    };
  }, [
    delivery.id,
    navigation,
  ]);

  async function handleAccept() {
    if (accepting) {
      return;
    }

    try {
      acceptingRef.current = true;
      setAccepting(true);

      await deliveryService.accept(
        delivery.id,
      );

      await routeAlertSound.stop();

      const session =
        await authService.getSession();

      const driverId =
        session?.user.driver_id;

      if (!driverId) {
        throw new Error(
          'Não foi possível identificar o entregador para iniciar o rastreamento.',
        );
      }

      try {
        await startDriverLocationTracking({
          driverId,
          deliveryId: delivery.id,
        });
      } catch (locationError) {
        console.log(
          '[location] Não foi possível iniciar o rastreamento:',
          locationError instanceof Error
            ? locationError.message
            : locationError,
        );

        Alert.alert(
          'Localização necessária',
          locationError instanceof Error
            ? locationError.message
            : 'Ative a localização para compartilhar sua posição durante a entrega.',
        );
      }

      navigation.replace('Pickup', {
        orderId: delivery.id,
      });
    } catch (error) {
      acceptingRef.current = false;

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

  async function handleReject() {
    if (accepting || rejecting) {
      return;
    }

    try {
      setRejecting(true);

      await deliveryService.reject(
        delivery.id,
      );

      await routeAlertSound.stop();

      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível rejeitar a corrida.';

      Alert.alert(
        'Corrida não rejeitada',
        message,
      );

    } finally {
      setRejecting(false);
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
          Nova corrida
        </Text>

        <Text
          style={{
            color: '#8B949E',
            fontSize: 12,
            marginTop: -14,
            marginBottom: 18,
          }}
        >
          {delivery.public_code ||
            `Pedido #${delivery.id}`}
          {'  '}·{' '}Recebida agora
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

        <Text
          style={{
            color: '#8B949E',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 18,
            marginBottom: 4,
          }}
        >
          Aceite para seguir diretamente
          para a rota de coleta.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginTop: 18,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={accepting || rejecting}
            style={[
              styles.rejectButton,
              {
                flex: 1,
                height: 58,
                borderWidth: 1,
                borderColor: '#454B52',
                backgroundColor: '#171A1F',
              },
              (accepting || rejecting) &&
                styles.acceptButtonDisabled,
            ]}
            onPress={() => {
              void handleReject();
            }}
          >
            {rejecting ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '900',
                }}
              >
                RECUSAR
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={accepting || rejecting}
            style={[
              styles.acceptButton,
              {
                flex: 1.45,
                height: 58,
                marginTop: 0,
                backgroundColor: '#F2C500',
              },
              (accepting || rejecting) &&
                styles.acceptButtonDisabled,
            ]}
            onPress={() => {
              void handleAccept();
            }}
          >
            {accepting ? (
              <ActivityIndicator
                color="#111111"
              />
            ) : (
              <Text
                style={{
                  color: '#111111',
                  fontSize: 16,
                  fontWeight: '900',
                }}
              >
                ACEITAR
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0C',
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
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },

  routeCard: {
    backgroundColor: '#15191E',
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
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 5,
  },

  address: {
    color: '#A1A8B0',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#30363D',
    marginVertical: 20,
  },

  distanceCard: {
    backgroundColor: '#15191E',
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
    color: '#8B949E',
    fontSize: 14,
  },

  distanceValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  totalDistanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    marginTop: 9,
    paddingTop: 13,
  },

  totalDistanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  totalDistanceValue: {
    color: '#FF6A00',
    fontSize: 17,
    fontWeight: '900',
  },

  packageCard: {
    backgroundColor: '#15191E',
    borderRadius: 20,
    padding: 18,
    marginTop: 15,
  },

  packageTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },

  packageText: {
    color: '#A1A8B0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },

  paymentCard: {
    backgroundColor: '#15191E',
    borderRadius: 20,
    padding: 22,
    marginTop: 15,
  },

  paymentLabel: {
    color: '#F2B900',
    fontSize: 12,
    fontWeight: '900',
  },

  paymentValue: {
    color: '#FFFFFF',
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

  acceptSlider: {
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 24,
    paddingHorizontal: 6,
  },

  acceptSliderText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  acceptSliderHandle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#15191E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  acceptSliderArrow: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
    marginTop: -3,
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

  rejectSlider: {
    height: 68,
    borderRadius: 34,
    backgroundColor: '#C53A40',
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'hidden',
    marginTop: 12,
    paddingHorizontal: 6,
  },

  rejectSliderText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  rejectSliderHandle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#15191E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  rejectSliderArrow: {
    color: '#C53A40',
    fontSize: 28,
    fontWeight: '900',
    marginTop: -3,
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
