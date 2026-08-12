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
import { walletService } from '../services/wallet';

import {
  startDriverLocationTracking,
  stopDriverLocationTracking,
  isDriverLocationTracking,
} from '../services/location';

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

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [gpsTracking, setGpsTracking] =
    useState(false);

  const [todayEarnings, setTodayEarnings] =
    useState(0);

  const [todayDeliveries, setTodayDeliveries] =
    useState(0);

  const [availableBalance, setAvailableBalance] =
    useState(0);

  const loadSession = useCallback(
    async () => {
      const session =
        await authService.getSession();

      if (!session) {
        navigation.replace('Login');
        return;
      }

      setUser(session.user);

      const driverId =
        session.user.driver_id;

      if (!driverId) {
        return;
      }

      try {
        const myDeliveries =
          await deliveryService.getMine();

        try {
          const wallet =
            await walletService.getWallet();

          setAvailableBalance(
            Number(wallet.available_balance || 0),
          );
        } catch (walletError) {
          console.log(
            '[wallet] Não foi possível carregar o saldo:',
            walletError instanceof Error
              ? walletError.message
              : walletError,
          );
        }

        const now = new Date();

        const deliveredToday =
          myDeliveries.filter(delivery => {
            if (
              delivery.status !== 'delivered' ||
              !delivery.delivered_at
            ) {
              return false;
            }

            const deliveredDate =
              new Date(delivery.delivered_at);

            if (
              Number.isNaN(
                deliveredDate.getTime(),
              )
            ) {
              return false;
            }

            return (
              deliveredDate.getFullYear() ===
                now.getFullYear() &&
              deliveredDate.getMonth() ===
                now.getMonth() &&
              deliveredDate.getDate() ===
                now.getDate()
            );
          });

        setTodayDeliveries(
          deliveredToday.length,
        );

        setTodayEarnings(
          deliveredToday.reduce(
            (total, delivery) =>
              total +
              Number(
                delivery.driver_amount || 0,
              ),
            0,
          ),
        );

        const activeDelivery =
          myDeliveries.find(delivery =>
            [
              'accepted',
              'driver_going_to_pickup',
              'arrived_at_pickup',
              'picked_up',
              'in_transit',
              'arrived_at_destination',
            ].includes(delivery.status),
          );

        if (activeDelivery) {
      await startDriverLocationTracking({
            driverId,
            deliveryId: activeDelivery.id,
          });

          setGpsTracking(
            isDriverLocationTracking(),
          );

          console.log(
            '[location] Rastreamento retomado para a entrega:',
            activeDelivery.id,
          );
        } else {
          await stopDriverLocationTracking();
          setGpsTracking(false);
        }
      } catch (trackingError) {
        setGpsTracking(false);
        console.log(
          '[location] Não foi possível retomar o rastreamento:',
          trackingError instanceof Error
            ? trackingError.message
            : trackingError,
        );
      }
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

    let cancelled = false;
    let activeSocket:
      Awaited<
        ReturnType<
          typeof connectDriverSocket
        >
      > | null = null;

    function refreshAvailableDeliveries() {
      loadDeliveries(false);
    }

    async function connectSocket() {
      try {
        const socket =
          await connectDriverSocket(
            Number(driverId),
          );

        if (cancelled) {
          return;
        }

        activeSocket = socket;

        setSocketConnected(socket.connected);

        socket.on('connect', () => {
          setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
        });

        socket.on(
          'delivery-offer-created',
          refreshAvailableDeliveries,
        );

        socket.on(
          'delivery-status-updated',
          refreshAvailableDeliveries,
        );
      } catch (socketError) {
        console.log(
          '[socket] Não foi possível conectar:',
          socketError instanceof Error
            ? socketError.message
            : socketError,
        );
      }
    }

    void connectSocket();

    return () => {
      cancelled = true;

      setSocketConnected(false);

      activeSocket?.off('connect');
      activeSocket?.off('disconnect');

      activeSocket?.off(
        'delivery-offer-created',
        refreshAvailableDeliveries,
      );

      activeSocket?.off(
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

    await Promise.all([
      loadSession(),
      loadDeliveries(false),
    ]);
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
        barStyle="light-content"
        backgroundColor="#0B0D10"
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

        <View style={styles.connectionRow}>
          <View style={styles.connectionItem}>
            <View
              style={[
                styles.connectionDot,
                isOnline
                  ? styles.connectionDotActive
                  : styles.connectionDotInactive,
              ]}
            />
            <Text style={styles.connectionText}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>

          <View style={styles.connectionItem}>
            <View
              style={[
                styles.connectionDot,
                socketConnected
                  ? styles.connectionDotActive
                  : styles.connectionDotInactive,
              ]}
            />
            <Text style={styles.connectionText}>
              {socketConnected
                ? 'SERVIDOR CONECTADO'
                : 'SERVIDOR DESCONECTADO'}
            </Text>
          </View>

          <View style={styles.connectionItem}>
            <View
              style={[
                styles.connectionDot,
                gpsTracking
                  ? styles.connectionDotActive
                  : styles.connectionDotInactive,
              ]}
            />
            <Text style={styles.connectionText}>
              {gpsTracking
                ? 'GPS RASTREANDO'
                : 'GPS EM ESPERA'}
            </Text>
          </View>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>
              RESUMO DE HOJE
            </Text>

            <View style={styles.todayLiveBadge}>
              <Text style={styles.todayLiveText}>
                AO VIVO
              </Text>
            </View>
          </View>

          <View style={styles.todayGrid}>
            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>
                GANHOS HOJE
              </Text>

              <Text style={styles.todayMoney}>
                {formatCurrency(todayEarnings)}
              </Text>
            </View>

            <View style={styles.todayDivider} />

            <View style={styles.todayItem}>
              <Text style={styles.todayLabel}>
                CORRIDAS HOJE
              </Text>

              <Text style={styles.todayNumber}>
                {todayDeliveries}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.walletCard}
          onPress={() =>
            navigation.navigate('Wallet')
          }
        >
          <View style={styles.walletContent}>
            <Text style={styles.walletLabel}>
              SALDO DISPONÍVEL
            </Text>

            <Text style={styles.walletBalance}>
              {formatCurrency(availableBalance)}
            </Text>

            <Text style={styles.walletTitle}>
              Carteira, ganhos e saques
            </Text>
          </View>

          <Text style={styles.walletArrow}>
            ›
          </Text>
        </TouchableOpacity>

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
    backgroundColor: '#0B0D10',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 48,
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
    color: '#9AA2AC',
    fontSize: 14,
    fontWeight: '700',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
    borderWidth: 1,
    borderColor: '#FF8A38',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  connectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },

  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  connectionDotActive: {
    backgroundColor: '#48B96D',
  },

  connectionDotInactive: {
    backgroundColor: '#777777',
  },

  connectionText: {
    color: '#C7CDD4',
    fontSize: 10,
    fontWeight: '900',
  },

  todayCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 20,
    padding: 17,
    marginBottom: 14,
  },

  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  todayTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  todayLiveBadge: {
    backgroundColor: '#10251A',
    borderWidth: 1,
    borderColor: '#245A39',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  todayLiveText: {
    color: '#52E28A',
    fontSize: 9,
    fontWeight: '900',
  },

  todayGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  todayItem: {
    flex: 1,
  },

  todayDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#30363D',
    marginHorizontal: 16,
  },

  todayLabel: {
    color: '#808A94',
    fontSize: 10,
    fontWeight: '800',
  },

  todayMoney: {
    color: '#52E28A',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 5,
  },

  todayNumber: {
    color: '#FF7A16',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 3,
  },

  walletCard: {
    minHeight: 88,
    borderRadius: 20,
    paddingHorizontal: 18,
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  walletContent: {
    flex: 1,
  },

  walletBalance: {
    color: '#52E28A',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },

  walletLabel: {
    color: '#FF7A16',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  walletTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 5,
  },

  walletArrow: {
    color: '#FF6A00',
    fontSize: 36,
    fontWeight: '300',
  },

  statusCard: {
    minHeight: 88,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
  },

  statusOnline: {
    backgroundColor: '#10231A',
    borderColor: '#235C3A',
  },

  statusOffline: {
    backgroundColor: '#181B1F',
    borderColor: '#30353B',
  },

  statusLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  statusText: {
    color: '#5CE695',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
    marginTop: 7,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  totalBadge: {
    minWidth: 31,
    height: 31,
    borderRadius: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#332014',
    borderWidth: 1,
    borderColor: '#6A3613',
  },

  totalText: {
    color: '#FF7A16',
    fontSize: 14,
    fontWeight: '900',
  },

  loadingCard: {
    minHeight: 180,
    borderRadius: 22,
    backgroundColor: '#15191E',
    borderWidth: 1,
    borderColor: '#292F36',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: '#8C949D',
    marginTop: 14,
    fontSize: 14,
  },

  emptyCard: {
    borderRadius: 22,
    backgroundColor: '#15191E',
    borderWidth: 1,
    borderColor: '#292F36',
    padding: 25,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#818A94',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  errorCard: {
    borderRadius: 22,
    backgroundColor: '#251414',
    borderWidth: 1,
    borderColor: '#633030',
    padding: 22,
  },

  errorTitle: {
    color: '#FF8585',
    fontSize: 17,
    fontWeight: '900',
  },

  errorText: {
    color: '#C99A9A',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  retryButton: {
    height: 46,
    borderRadius: 13,
    backgroundColor: '#B23A3A',
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
    backgroundColor: '#15191E',
    borderRadius: 23,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2B3138',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    color: '#8D96A0',
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
    backgroundColor: '#39C878',
  },

  routeLine: {
    width: 2,
    height: 58,
    backgroundColor: '#333A43',
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
    color: '#76808B',
    fontSize: 10,
    fontWeight: '900',
  },

  routeName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },

  routeAddress: {
    color: '#8B949E',
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
    backgroundColor: '#101318',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#292F36',
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
  },

  distanceLabel: {
    color: '#747E88',
    fontSize: 11,
    fontWeight: '700',
  },

  distanceValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  paymentCard: {
    backgroundColor: '#10251A',
    borderColor: '#245A39',
    borderWidth: 1,
    borderRadius: 17,
    padding: 17,
    marginTop: 17,
  },

  paymentLabel: {
    color: '#70A982',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  paymentValue: {
    color: '#52E28A',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 3,
  },

  estimatedTime: {
    color: '#818A94',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'right',
  },

  acceptButton: {
    height: 56,
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
    letterSpacing: 0.8,
  },
});

