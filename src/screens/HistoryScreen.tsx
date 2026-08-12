import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  deliveryService,
} from '../services/delivery';

import type {
  Delivery,
} from '../types/delivery';

function money(value: number | string): string {
  return Number(value || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  );
}

function distance(value: number): string {
  return `${Number(value || 0).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    },
  )} km`;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Data não informada';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data não informada';
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  );
}

function normalizeCity(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function isUrban(delivery: Delivery): boolean {
  return (
    normalizeCity(delivery.pickup_city) ===
    normalizeCity(delivery.destination_city)
  );
}

export default function HistoryScreen() {
  const [deliveries, setDeliveries] =
    useState<Delivery[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadHistory = useCallback(
    async () => {
      try {
        setError(null);

        const result =
          await deliveryService.getMine();

        const completed =
          result
            .filter(
              delivery =>
                delivery.status === 'delivered',
            )
            .sort((a, b) => {
              const aDate =
                new Date(
                  a.delivered_at ||
                  a.created_at ||
                  0,
                ).getTime();

              const bDate =
                new Date(
                  b.delivered_at ||
                  b.created_at ||
                  0,
                ).getTime();

              return bDate - aDate;
            });

        setDeliveries(completed);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar o histórico.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadHistory();
    }, [loadHistory]),
  );

  async function refresh() {
    setRefreshing(true);
    await loadHistory();
  }

  const totalEarned =
    deliveries.reduce(
      (total, delivery) =>
        total +
        Number(delivery.driver_amount || 0),
      0,
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        <Text style={styles.title}>
          Histórico de corridas
        </Text>

        <Text style={styles.subtitle}>
          Corridas finalizadas e valores recebidos
        </Text>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>
              CORRIDAS CONCLUÍDAS
            </Text>

            <Text style={styles.summaryNumber}>
              {deliveries.length}
            </Text>
          </View>

          <View style={styles.summaryRight}>
            <Text style={styles.summaryLabel}>
              TOTAL RECEBIDO
            </Text>

            <Text style={styles.summaryMoney}>
              {money(totalEarned)}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerCard}>
            <ActivityIndicator
              size="large"
              color="#FF6A00"
            />

            <Text style={styles.loadingText}>
              Carregando histórico...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Não foi possível carregar
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : deliveries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Nenhuma corrida concluída
            </Text>

            <Text style={styles.emptyText}>
              Suas entregas finalizadas aparecerão aqui.
            </Text>
          </View>
        ) : (
          deliveries.map(delivery => {
            const urban =
              isUrban(delivery);

            return (
              <View
                key={delivery.id}
                style={styles.deliveryCard}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.typeBadge,
                      urban
                        ? styles.urbanBadge
                        : styles.intercityBadge,
                    ]}
                  >
                    <Text style={styles.typeText}>
                      {urban
                        ? 'URBANA'
                        : 'INTERMUNICIPAL'}
                    </Text>
                  </View>

                  <Text style={styles.code}>
                    {delivery.public_code}
                  </Text>
                </View>

                <Text style={styles.date}>
                  {formatDate(
                    delivery.delivered_at ||
                    delivery.created_at,
                  )}
                </Text>

                <View style={styles.routeBlock}>
                  <Text style={styles.routeLabel}>
                    ORIGEM
                  </Text>

                  <Text style={styles.city}>
                    {delivery.pickup_city}
                  </Text>

                  <Text style={styles.address}>
                    {[
                      delivery.pickup_street,
                      delivery.pickup_number,
                      delivery.pickup_neighborhood,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.routeBlock}>
                  <Text style={styles.routeLabel}>
                    DESTINO
                  </Text>

                  <Text style={styles.city}>
                    {delivery.destination_city}
                  </Text>

                  <Text style={styles.address}>
                    {[
                      delivery.destination_street,
                      delivery.destination_number,
                      delivery.destination_neighborhood,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>

                <View style={styles.footer}>
                  <View>
                    <Text style={styles.footerLabel}>
                      DISTÂNCIA
                    </Text>

                    <Text style={styles.footerValue}>
                      {distance(
                        Number(
                          delivery.billable_distance_km ||
                          delivery.route_distance_km ||
                          0,
                        ),
                      )}
                    </Text>
                  </View>

                  <View style={styles.amountBlock}>
                    <Text style={styles.footerLabel}>
                      VOCÊ RECEBEU
                    </Text>

                    <Text style={styles.amount}>
                      {money(
                        delivery.driver_amount,
                      )}
                    </Text>
                  </View>
                </View>
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
    padding: 18,
    paddingBottom: 50,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
  },

  subtitle: {
    color: '#818A94',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 18,
  },

  summaryCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  summaryRight: {
    alignItems: 'flex-end',
  },

  summaryLabel: {
    color: '#808A94',
    fontSize: 9,
    fontWeight: '900',
  },

  summaryNumber: {
    color: '#FF7A16',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 4,
  },

  summaryMoney: {
    color: '#52E28A',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 5,
  },

  centerCard: {
    backgroundColor: '#171B20',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
  },

  loadingText: {
    color: '#8B949E',
    marginTop: 12,
  },

  errorCard: {
    backgroundColor: '#251515',
    borderWidth: 1,
    borderColor: '#5A2929',
    borderRadius: 18,
    padding: 18,
  },

  errorTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  errorText: {
    color: '#D49797',
    marginTop: 6,
  },

  emptyCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 22,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  emptyText: {
    color: '#818A94',
    marginTop: 6,
    lineHeight: 20,
  },

  deliveryCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 20,
    padding: 17,
    marginBottom: 13,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  typeBadge: {
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },

  urbanBadge: {
    backgroundColor: '#173824',
  },

  intercityBadge: {
    backgroundColor: '#42250F',
  },

  typeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },

  code: {
    color: '#AAB2BB',
    fontSize: 11,
    fontWeight: '800',
  },

  date: {
    color: '#69727C',
    fontSize: 11,
    marginTop: 10,
    marginBottom: 15,
  },

  routeBlock: {
    paddingVertical: 3,
  },

  routeLabel: {
    color: '#69727C',
    fontSize: 9,
    fontWeight: '900',
  },

  city: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },

  address: {
    color: '#929BA4',
    fontSize: 12,
    marginTop: 3,
  },

  routeLine: {
    height: 1,
    backgroundColor: '#292F36',
    marginVertical: 12,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#292F36',
    marginTop: 15,
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  footerLabel: {
    color: '#69727C',
    fontSize: 9,
    fontWeight: '900',
  },

  footerValue: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    marginTop: 4,
  },

  amountBlock: {
    alignItems: 'flex-end',
  },

  amount: {
    color: '#52E28A',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 3,
  },
});
