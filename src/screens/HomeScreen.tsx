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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
      <StatusBar barStyle="light-content" backgroundColor="#0B0D10" />

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
            <Text style={styles.brand}>TATURANA ENTREGADOR</Text>
            <Text style={styles.greeting}>Olá, {firstName}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <View>
              <Text style={styles.statusTitle}>{isOnline ? 'Online' : 'Offline'}</Text>
              <Text style={styles.statusMeta}>
                {socketConnected ? 'Servidor conectado' : 'Servidor em espera'} · {gpsTracking ? 'GPS ativo' : 'GPS em espera'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleOnlineChange}
            trackColor={{ false: '#343A40', true: '#238C50' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>TRABALHO</Text>
            <Text style={styles.sectionTitle}>Corridas disponíveis</Text>
          </View>
          {isOnline && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalText}>{deliveries.length}</Text>
            </View>
          )}
        </View>

        {!isOnline ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Você está offline</Text>
            <Text style={styles.emptyText}>Ative seu status para receber novas corridas.</Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#FF6A00" />
            <Text style={styles.loadingText}>Buscando corridas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Não foi possível atualizar</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity activeOpacity={0.85} style={styles.retryButton} onPress={() => loadDeliveries(true)}>
              <Text style={styles.retryButtonText}>TENTAR NOVAMENTE</Text>
            </TouchableOpacity>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>Nenhuma corrida disponível</Text>
            <Text style={styles.emptyText}>Continue online. Novas solicitações aparecerão automaticamente.</Text>
          </View>
        ) : (
          deliveries.map((delivery) => {
            const isIntercity = delivery.delivery_type === 'intercity';
            return (
              <View key={delivery.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={[styles.orderBadge, isIntercity ? styles.intercityBadge : styles.urbanBadge]}>
                    <Text style={styles.orderBadgeText}>{isIntercity ? 'INTERMUNICIPAL' : 'URBANA'}</Text>
                  </View>
                  <Text style={styles.orderNumber}>{delivery.public_code || `Pedido #${delivery.id}`}</Text>
                </View>

                <View style={styles.routeContainer}>
                  <View style={styles.routeIcons}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeLine} />
                    <View style={styles.deliveryDot} />
                  </View>
                  <View style={styles.routeTextContainer}>
                    <View style={styles.routeBlock}>
                      <Text style={styles.routeLabel}>RETIRADA</Text>
                      <Text style={styles.routeName}>{delivery.pickup_city}</Text>
                      <Text style={styles.routeAddress}>{formatAddress(delivery.pickup_street, delivery.pickup_number, delivery.pickup_neighborhood)}</Text>
                    </View>
                    <View style={styles.routeBlock}>
                      <Text style={styles.routeLabel}>ENTREGA</Text>
                      <Text style={styles.routeName}>{delivery.destination_city}</Text>
                      <Text style={styles.routeAddress}>{formatAddress(delivery.destination_street, delivery.destination_number, delivery.destination_neighborhood)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.tripFooter}>
                  <View>
                    <Text style={styles.tripMetaLabel}>DISTÂNCIA</Text>
                    <Text style={styles.tripMetaValue}>{formatDistance(delivery.distance_total_km)}</Text>
                  </View>
                  {delivery.estimated_duration_minutes ? (
                    <View style={styles.tripMetaRight}>
                      <Text style={styles.tripMetaLabel}>ESTIMATIVA</Text>
                      <Text style={styles.tripMetaValue}>{delivery.estimated_duration_minutes} min</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.earningRow}>
                  <View>
                    <Text style={styles.paymentLabel}>SEU GANHO</Text>
                    <Text style={styles.paymentValue}>{formatCurrency(delivery.driver_amount)}</Text>
                  </View>
                  <TouchableOpacity activeOpacity={0.85} style={styles.acceptButton} onPress={() => openOrder(delivery)}>
                    <Text style={styles.acceptButtonText}>VER PEDIDO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.blockTitle}>HOJE</Text>
        <View style={styles.todayCard}>
          <View style={styles.todayItem}>
            <Text style={styles.todayLabel}>GANHOS</Text>
            <Text style={styles.todayMoney}>{formatCurrency(todayEarnings)}</Text>
          </View>
          <View style={styles.todayDivider} />
          <View style={styles.todayItem}>
            <Text style={styles.todayLabel}>ENTREGAS</Text>
            <Text style={styles.todayNumber}>{todayDeliveries}</Text>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.walletCard} onPress={() => navigation.navigate('Wallet')}>
          <View>
            <Text style={styles.walletLabel}>SALDO DISPONÍVEL</Text>
            <Text style={styles.walletBalance}>{formatCurrency(availableBalance)}</Text>
          </View>
          <View style={styles.walletAction}>
            <Text style={styles.walletActionText}>CARTEIRA</Text>
            <Text style={styles.walletArrow}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.blockTitle}>MAIS</Text>
        <View style={styles.moreRow}>
          <TouchableOpacity style={styles.moreButton} onPress={() => navigation.navigate('History')}>
            <Text style={styles.moreIcon}>H</Text><Text style={styles.moreText}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={() => navigation.navigate('DriverDocuments')}>
            <Text style={styles.moreIcon}>DOC</Text><Text style={styles.moreText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={() => navigation.navigate('Support')}>
            <Text style={styles.moreIcon}>?</Text><Text style={styles.moreText}>Suporte</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            height: 70 + Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.navItemActive}>
          <Text style={styles.navIconActive}>●</Text>
          <Text style={styles.navTextActive}>Início</Text>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.navIcon}>H</Text>
          <Text style={styles.navText}>Corridas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Text style={styles.navIcon}>R$</Text>
          <Text style={styles.navText}>Carteira</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>EU</Text>
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D10' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 95 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerText: { flex: 1 },
  brand: { color: '#7F8993', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  greeting: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginTop: 3 },
  avatar: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#20262D', borderWidth: 1, borderColor: '#343B44' },
  avatarText: { color: '#FF7A16', fontSize: 17, fontWeight: '900' },

  statusBar: { minHeight: 66, borderRadius: 18, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#121A16', borderWidth: 1, borderColor: '#214E34', marginBottom: 22 },
  statusInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 11 },
  dotOnline: { backgroundColor: '#52E28A' },
  dotOffline: { backgroundColor: '#777F87' },
  statusTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  statusMeta: { color: '#82908A', fontSize: 10, marginTop: 3 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sectionEyebrow: { color: '#FF7A16', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 3 },
  sectionTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  totalBadge: { minWidth: 31, height: 31, borderRadius: 16, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#332014', borderWidth: 1, borderColor: '#6A3613' },
  totalText: { color: '#FF7A16', fontSize: 14, fontWeight: '900' },

  loadingCard: { minHeight: 145, borderRadius: 20, backgroundColor: '#15191E', borderWidth: 1, borderColor: '#292F36', alignItems: 'center', justifyContent: 'center', padding: 22, marginBottom: 22 },
  loadingText: { color: '#8C949D', marginTop: 12, fontSize: 13 },
  emptyCard: { minHeight: 145, borderRadius: 20, backgroundColor: '#15191E', borderWidth: 1, borderColor: '#292F36', padding: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyIcon: { color: '#52E28A', fontSize: 22, fontWeight: '900', marginBottom: 7 },
  emptyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#818A94', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  errorCard: { borderRadius: 20, backgroundColor: '#251414', borderWidth: 1, borderColor: '#633030', padding: 20, marginBottom: 22 },
  errorTitle: { color: '#FF8585', fontSize: 16, fontWeight: '900' },
  errorText: { color: '#C99A9A', fontSize: 13, lineHeight: 19, marginTop: 7 },
  retryButton: { height: 44, borderRadius: 12, backgroundColor: '#B23A3A', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  orderCard: { backgroundColor: '#15191E', borderRadius: 22, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: '#2B3138' },
  orderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  orderBadge: { borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 },
  urbanBadge: { backgroundColor: '#228B4E' },
  intercityBadge: { backgroundColor: '#FF6A00' },
  orderBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  orderNumber: { flex: 1, color: '#747E88', fontSize: 10, fontWeight: '700', marginLeft: 10, textAlign: 'right' },
  routeContainer: { flexDirection: 'row' },
  routeIcons: { width: 18, alignItems: 'center', paddingTop: 5 },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#39C878' },
  routeLine: { width: 2, height: 50, backgroundColor: '#333A43' },
  deliveryDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: '#FF6A00' },
  routeTextContainer: { flex: 1, paddingLeft: 11 },
  routeBlock: { minHeight: 67 },
  routeLabel: { color: '#76808B', fontSize: 9, fontWeight: '900' },
  routeName: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 2 },
  routeAddress: { color: '#8B949E', fontSize: 12, lineHeight: 17, marginTop: 2 },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#292F36', paddingTop: 12, marginTop: 7 },
  tripMetaRight: { alignItems: 'flex-end' },
  tripMetaLabel: { color: '#68727C', fontSize: 9, fontWeight: '900' },
  tripMetaValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 2 },
  earningRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#10251A', borderColor: '#245A39', borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 13 },
  paymentLabel: { color: '#70A982', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  paymentValue: { color: '#52E28A', fontSize: 25, fontWeight: '900', marginTop: 2 },
  acceptButton: { height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF6A00', paddingHorizontal: 16, marginLeft: 10 },
  acceptButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  blockTitle: { color: '#7F8993', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 8, marginBottom: 9 },
  todayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#15191E', borderWidth: 1, borderColor: '#292F36', borderRadius: 18, padding: 15, marginBottom: 12 },
  todayItem: { flex: 1 },
  todayDivider: { width: 1, height: 43, backgroundColor: '#30363D', marginHorizontal: 14 },
  todayLabel: { color: '#77818B', fontSize: 9, fontWeight: '900' },
  todayMoney: { color: '#52E28A', fontSize: 21, fontWeight: '900', marginTop: 4 },
  todayNumber: { color: '#FF7A16', fontSize: 23, fontWeight: '900', marginTop: 2 },

  walletCard: { minHeight: 75, borderRadius: 18, paddingHorizontal: 16, backgroundColor: '#15191E', borderWidth: 1, borderColor: '#292F36', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  walletLabel: { color: '#77818B', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  walletBalance: { color: '#52E28A', fontSize: 23, fontWeight: '900', marginTop: 3 },
  walletAction: { flexDirection: 'row', alignItems: 'center' },
  walletActionText: { color: '#FF7A16', fontSize: 10, fontWeight: '900' },
  walletArrow: { color: '#FF6A00', fontSize: 28, marginLeft: 7, marginTop: -2 },

  moreRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  moreButton: { flex: 1, minHeight: 59, backgroundColor: '#15191E', borderWidth: 1, borderColor: '#292F36', borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  moreIcon: { color: '#FF7A16', fontSize: 10, fontWeight: '900', marginBottom: 4 },
  moreText: { color: '#C9CED4', fontSize: 10, fontWeight: '800' },

  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#12161A',
    borderTopWidth: 1,
    borderTopColor: '#292F36',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    backgroundColor: '#1B241F',
    borderRadius: 14,
  },
  navIcon: {
    color: '#9AA3AC',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  navIconActive: {
    color: '#52E28A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  navText: {
    color: '#AAB1B8',
    fontSize: 12,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
