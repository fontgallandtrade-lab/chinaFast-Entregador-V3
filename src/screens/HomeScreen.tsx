import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  DELIVERY_REFRESH_INTERVAL,
} from '../constants/config';

import { authService } from '../services/auth';
import { deliveryService } from '../services/delivery';
import { pushService } from '../services/push';

import {
  connectDriverSocket,
  disconnectDriverSocket,
  setDriverOffline,
} from '../services/socket';

import type { AuthUser } from '../types/auth';
import type { Delivery } from '../types/delivery';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;

function formatCurrency(value: number): string {
  return Number(value || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  );
}

function formatDistance(value: number): string {
  return `${Number(value || 0).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    },
  )} km`;
}

function formatAddress(
  street?: string | null,
  number?: string | null,
  neighborhood?: string | null,
): string {
  return [
    street,
    number,
    neighborhood,
  ]
    .filter(Boolean)
    .join(', ');
}

export default function HomeScreen({
  navigation,
}: Props) {
  const [isOnline, setIsOnline] =
    useState(true);

  const [deliveries, setDeliveries] =
    useState<Delivery[]>([]);

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadSession = useCallback(
    async () => {
      const session =
        await authService.getSession();

      if (!session) {
        navigation.replace('Login');
        return;
      }

      setUser(session.user);
    },
    [navigation],
  );

  const loadDeliveries = useCallback(
    async (showLoader = false) => {
      if (!isOnline) {
        setDeliveries([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        setError(null);

        const available =
          await deliveryService.getAvailable();

        setDeliveries(available);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível buscar as corridas.';

        setError(message);

        const normalizedMessage =
          message.toLowerCase();

        if (
          normalizedMessage.includes('token') ||
          normalizedMessage.includes('autoriz') ||
          normalizedMessage.includes('jwt')
        ) {
          await authService.logout();
          navigation.replace('Login');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isOnline, navigation],
  );

  useFocusEffect(
    useCallback(() => {
      loadSession();
      loadDeliveries(true);
    }, [
      loadDeliveries,
      loadSession,
    ]),
  );

  useEffect(() => {
    if (!isOnline) {
      setDeliveries([]);
      return;
    }

    const interval = setInterval(
      () => {
        loadDeliveries(false);
      },
      DELIVERY_REFRESH_INTERVAL,
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    isOnline,
    loadDeliveries,
  ]);

  useEffect(() => {
    if (!user?.driver_id) {
      return;
    }

    pushService
      .registerPushToken()
      .catch((pushError) => {
        console.log(
          '[push] Falha ao registrar token:',
          pushError instanceof Error
            ? pushError.message
            : pushError,
        );
      });
  }, [user?.driver_id]);

  useEffect(() => {
    const driverId = user?.driver_id;

    if (!driverId) {
      return;
    }

    if (!isOnline) {
      setDriverOffline(driverId);
      return;
    }

    const socket =
      connectDriverSocket(driverId);

    function refreshAvailableDeliveries() {
      loadDeliveries(false);
    }

    socket.on(
      'delivery-offer-created',
      refreshAvailableDeliveries,
    );

    socket.on(
      'delivery-status-updated',
      refreshAvailableDeliveries,
    );

    return () => {
      socket.off(
        'delivery-offer-created',
        refreshAvailableDeliveries,
      );

      socket.off(
        'delivery-status-updated',
        refreshAvailableDeliveries,
      );
    };
  }, [
    user?.driver_id,
    isOnline,
    loadDeliveries,
  ]);

  useEffect(() => {
    return () => {
      disconnectDriverSocket();
    };
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadDeliveries(false);
  }

  function handleOnlineChange(
    value: boolean,
  ) {
    setIsOnline(value);
    setError(null);

    if (!value) {
      setDeliveries([]);
    }
  }

  function openOrder(
    delivery: Delivery,
  ) {
    navigation.navigate('Order', {
      delivery,
    });
  }

  const firstName =
    user?.name
      ?.trim()
      .split(/\s+/)[0] ||
    'entregador';

  const initial =
    firstName
      .charAt(0)
      .toUpperCase() ||
    'E';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F3F5F7"
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6A00']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Olá, {firstName}
            </Text>

            <Text style={styles.title}>
              Pronto para trabalhar?
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initial}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusCard,
            isOnline
              ? styles.statusOnline
              : styles.statusOffline,
          ]}
        >
          <View>
            <Text style={styles.statusLabel}>
              Seu status
            </Text>

            <Text style={styles.statusText}>
              {isOnline
                ? 'Você está online'
                : 'Você está offline'}
            </Text>
          </View>

          <Switch
            value={isOnline}
            onValueChange={handleOnlineChange}
            trackColor={{
              false: '#B5B5B5',
              true: '#48B96D',
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Corridas disponíveis
          </Text>

          {isOnline && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>
                {deliveries.length}
              </Text>
            </View>
          )}
        </View>

        {!isOnline ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Você está offline
            </Text>

            <Text style={styles.emptyText}>
              Ative seu status para receber
              novas corridas.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color="#FF6A00"
            />

            <Text style={styles.loadingText}>
              Buscando corridas...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Não foi possível atualizar
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.retryButton}
              onPress={() =>
                loadDeliveries(true)
              }
            >
              <Text
                style={styles.retryButtonText}
              >
                TENTAR NOVAMENTE
              </Text>
            </TouchableOpacity>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Nenhuma corrida disponível
            </Text>

            <Text style={styles.emptyText}>
              Continue online. Novas solicitações
              aparecerão automaticamente.
            </Text>
          </View>
        ) : (
          deliveries.map((delivery) => {
            const isIntercity =
              delivery.delivery_type ===
              'intercity';

            return (
              <View
                key={delivery.id}
                style={styles.orderCard}
              >
                <View style={styles.orderTop}>
                  <View
                    style={[
                      styles.orderBadge,
                      isIntercity
                        ? styles.intercityBadge
                        : styles.urbanBadge,
                    ]}
                  >
                    <Text
                      style={styles.orderBadgeText}
                    >
                      {isIntercity
                        ? 'INTERMUNICIPAL'
                        : 'URBANA'}
                    </Text>
                  </View>

                  <Text style={styles.orderNumber}>
                    {delivery.public_code ||
                      `Pedido #${delivery.id}`}
                  </Text>
                </View>

                <View style={styles.routeContainer}>
                  <View style={styles.routeIcons}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeLine} />
                    <View
                      style={styles.deliveryDot}
                    />
                  </View>

                  <View
                    style={styles.routeTextContainer}
                  >
                    <View style={styles.routeBlock}>
                      <Text
                        style={styles.routeLabel}
                      >
                        RETIRADA
                      </Text>

                      <Text style={styles.routeName}>
                        {delivery.pickup_city}
                      </Text>

                      <Text
                        style={styles.routeAddress}
                      >
                        {formatAddress(
                          delivery.pickup_street,
                          delivery.pickup_number,
                          delivery.pickup_neighborhood,
                        )}
                      </Text>
                    </View>

                    <View style={styles.routeBlock}>
                      <Text
                        style={styles.routeLabel}
                      >
                        ENTREGA
                      </Text>

                      <Text style={styles.routeName}>
                        {delivery.destination_city}
                      </Text>

                      <Text
                        style={styles.routeAddress}
                      >
                        {formatAddress(
                          delivery.destination_street,
                          delivery.destination_number,
                          delivery.destination_neighborhood,
                        )}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.distanceGrid}>
                  <View style={styles.distanceItem}>
                    <Text
                      style={styles.distanceLabel}
                    >
                      Ida
                    </Text>

                    <Text
                      style={styles.distanceValue}
                    >
                      {formatDistance(
                        delivery
                          .distance_outbound_km,
                      )}
                    </Text>
                  </View>

                  {isIntercity && (
                    <View
                      style={styles.distanceItem}
                    >
                      <Text
                        style={styles.distanceLabel}
                      >
                        Retorno
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

                  <View style={styles.distanceItem}>
                    <Text
                      style={styles.distanceLabel}
                    >
                      Total
                    </Text>

                    <Text
                      style={styles.distanceValue}
                    >
                      {formatDistance(
                        delivery
                          .distance_total_km,
                      )}
                    </Text>
                  </View>
                </View>

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
                  <Text
                    style={styles.estimatedTime}
                  >
                    Tempo estimado:{' '}
                    {
                      delivery
                        .estimated_duration_minutes
                    } min
                  </Text>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.acceptButton}
                  onPress={() =>
                    openOrder(delivery)
                  }
                >
                  <Text
                    style={styles.acceptButtonText}
                  >
                    VER PEDIDO
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    color: '#666666',
    fontSize: 15,
  },

  title: {
    color: '#171717',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  statusCard: {
    minHeight: 86,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  statusOnline: {
    backgroundColor: '#E9F8EE',
  },

  statusOffline: {
    backgroundColor: '#EBEDF0',
  },

  statusLabel: {
    color: '#606060',
    fontSize: 13,
    fontWeight: '600',
  },

  statusText: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '900',
  },

  totalBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E5',
  },

  totalText: {
    color: '#FF6A00',
    fontSize: 15,
    fontWeight: '900',
  },

  loadingCard: {
    minHeight: 180,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: '#666666',
    marginTop: 14,
    fontSize: 14,
  },

  emptyCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#202020',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#777777',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  errorCard: {
    borderRadius: 22,
    backgroundColor: '#FFF1F1',
    padding: 22,
  },

  errorTitle: {
    color: '#A72B2B',
    fontSize: 17,
    fontWeight: '900',
  },

  errorText: {
    color: '#7B4545',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  retryButton: {
    height: 46,
    borderRadius: 13,
    backgroundColor: '#A72B2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 18,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 7,
  },

  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  orderBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  urbanBadge: {
    backgroundColor: '#228B4E',
  },

  intercityBadge: {
    backgroundColor: '#FF6A00',
  },

  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  orderNumber: {
    flex: 1,
    color: '#4E4E4E',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    textAlign: 'right',
  },

  routeContainer: {
    flexDirection: 'row',
  },

  routeIcons: {
    width: 20,
    alignItems: 'center',
    paddingTop: 5,
  },

  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#228B4E',
  },

  routeLine: {
    width: 2,
    height: 58,
    backgroundColor: '#D8DDE2',
  },

  deliveryDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FF6A00',
  },

  routeTextContainer: {
    flex: 1,
    paddingLeft: 12,
  },

  routeBlock: {
    minHeight: 76,
  },

  routeLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '900',
  },

  routeName: {
    color: '#202020',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  routeAddress: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  distanceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  distanceItem: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    borderRadius: 13,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  distanceLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
  },

  distanceValue: {
    color: '#202020',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  paymentCard: {
    backgroundColor: '#EAF8EF',
    borderRadius: 17,
    padding: 17,
    marginTop: 17,
  },

  paymentLabel: {
    color: '#50735B',
    fontSize: 12,
    fontWeight: '900',
  },

  paymentValue: {
    color: '#188642',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },

  estimatedTime: {
    color: '#737373',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'right',
  },

  acceptButton: {
    height: 54,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
    marginTop: 17,
  },

  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
