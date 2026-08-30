import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useDeliveries } from '../context/DeliveryContext';

import useLocationTracking from '../hooks/useLocationTracking';

import {
  deliveryStatusLabel,
  nextDeliveryAction,
} from '../utils/deliveryStatus';

import {
  formatAddress,
  formatDistance,
  formatMoney,
} from '../utils/formatters';

export default function DeliveryScreen() {
  const { driver } = useAuth();

  const {
    activeDelivery,
    updateStatus,
    confirmPickup,
    confirmDelivery,
    loading,
  } = useDeliveries();

  const [processing, setProcessing] =
    useState(false);

  const [securityCode, setSecurityCode] =
    useState('');

  const { location } =
    useLocationTracking(
      driver?.id,
      driver?.online,
      activeDelivery?.id
    );

  async function openNavigation(type) {
    const prefix =
      type === 'pickup' ? 'pickup' : 'destination';

    const lat =
      activeDelivery?.[`${prefix}_latitude`];
    const lng =
      activeDelivery?.[`${prefix}_longitude`];
    if (!lat || !lng) {
      Alert.alert(
        'Endereço indisponível',
        'Não foi possível abrir a navegação.'
      );
      return;
    }

    const destination = `${lat},${lng}`;
    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

    await Linking.openURL(url);
  }

  async function handleNextStatus() {
    const action =
      nextDeliveryAction(
        activeDelivery.status
      );

    if (!action) {
      return;
    }

    setProcessing(true);

    try {
      await updateStatus(
        action.nextStatus,
        location
      );

      Alert.alert(
        'Status atualizado',
        deliveryStatusLabel(
          action.nextStatus
        )
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        error.message
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleConfirmCode() {
    if (!securityCode.trim()) {
      Alert.alert(
        'Código obrigatório',
        'Digite o código informado pelo cliente.'
      );

      return;
    }

    setProcessing(true);

    try {
      if (
        activeDelivery.status ===
        'arrived_at_pickup'
      ) {
        await confirmPickup(
          securityCode.trim(),
          location
        );

        Alert.alert(
          'Coleta confirmada',
          'O pacote foi coletado.'
        );
      } else {
        const result =
          await confirmDelivery(
            securityCode.trim(),
            location
          );

        Alert.alert(
          'Entrega concluída',
          result.message ||
            'O valor foi creditado na carteira.'
        );
      }

      setSecurityCode('');
    } catch (error) {
      Alert.alert(
        'Código inválido',
        error.message
      );
    } finally {
      setProcessing(false);
    }
  }

  if (loading && !activeDelivery) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#d71920"
        />
      </SafeAreaView>
    );
  }

  if (!activeDelivery) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyIcon}>
          📦
        </Text>

        <Text style={styles.emptyTitle}>
          Nenhuma entrega ativa
        </Text>

        <Text style={styles.emptyText}>
          Aceite uma corrida na tela inicial.
        </Text>
      </SafeAreaView>
    );
  }

  const action =
    nextDeliveryAction(
      activeDelivery.status
    );

  const needsPickupCode =
    activeDelivery.status ===
    'arrived_at_pickup';

  const needsDeliveryCode =
    activeDelivery.status ===
    'arrived_at_destination';

  const navigationTarget =
    [
      'accepted',
      'driver_going_to_pickup',
      'arrived_at_pickup',
    ].includes(activeDelivery.status)
      ? 'pickup'
      : 'destination';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>
          Entrega em andamento
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.code}>
            {activeDelivery.public_code}
          </Text>

          <Text style={styles.status}>
            {deliveryStatusLabel(
              activeDelivery.status
            )}
          </Text>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.label}>
            COLETA
          </Text>

          <Text style={styles.address}>
            {formatAddress(
              activeDelivery,
              'pickup'
            )}
          </Text>

          {activeDelivery.pickup_contact_name ? (
            <Text style={styles.contact}>
              {activeDelivery.pickup_contact_name}
              {'  '}
              {activeDelivery.pickup_contact_phone}
            </Text>
          ) : null}

          <View style={styles.divider} />

          <Text style={styles.label}>
            DESTINO
          </Text>

          <Text style={styles.address}>
            {formatAddress(
              activeDelivery,
              'destination'
            )}
          </Text>

          {activeDelivery.destination_contact_name ? (
            <Text style={styles.contact}>
              {
                activeDelivery.destination_contact_name
              }
              {'  '}
              {
                activeDelivery.destination_contact_phone
              }
            </Text>
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Distância
            </Text>

            <Text style={styles.summaryValue}>
              {formatDistance(
                activeDelivery.route_distance_km
              )}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Ganho
            </Text>

            <Text style={styles.money}>
              {formatMoney(
                activeDelivery.driver_amount
              )}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.mapButton}
          onPress={() =>
            openNavigation(navigationTarget)
          }
        >
          <Text style={styles.buttonText}>
            ABRIR NO GOOGLE MAPS
          </Text>
        </Pressable>

        {needsPickupCode ||
        needsDeliveryCode ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeTitle}>
              {needsPickupCode
                ? 'Código de coleta'
                : 'Código de entrega'}
            </Text>

            <Text style={styles.codeHint}>
              Solicite o código de segurança ao
              responsável.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite o código"
              placeholderTextColor="#888888"
              keyboardType="number-pad"
              value={securityCode}
              onChangeText={setSecurityCode}
              maxLength={10}
            />

            <Pressable
              style={[
                styles.primaryButton,
                processing && styles.disabled,
              ]}
              disabled={processing}
              onPress={handleConfirmCode}
            >
              {processing ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text style={styles.buttonText}>
                  {needsPickupCode
                    ? 'CONFIRMAR COLETA'
                    : 'FINALIZAR ENTREGA'}
                </Text>
              )}
            </Pressable>
          </View>
        ) : action ? (
          <Pressable
            style={[
              styles.primaryButton,
              processing && styles.disabled,
            ]}
            disabled={processing}
            onPress={handleNextStatus}
          >
            {processing ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text style={styles.buttonText}>
                {action.label}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },

  center: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  content: {
    padding: 20,
    paddingBottom: 110,
  },

  title: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 18,
  },

  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },

  code: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '900',
  },

  status: {
    color: '#2e7d32',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },

  routeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 14,
  },

  label: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '900',
  },

  address: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    marginTop: 5,
  },

  contact: {
    color: '#666666',
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 18,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 17,
  },

  summaryLabel: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },

  summaryValue: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },

  money: {
    color: '#2e7d32',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },

  mapButton: {
    height: 56,
    borderRadius: 15,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  primaryButton: {
    height: 60,
    borderRadius: 16,
    backgroundColor: '#d71920',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  disabled: {
    opacity: 0.6,
  },

  codeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
  },

  codeTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },

  codeHint: {
    color: '#777777',
    lineHeight: 20,
    marginTop: 6,
  },

  input: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },

  emptyIcon: {
    fontSize: 52,
  },

  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 15,
  },

  emptyText: {
    color: '#aaaaaa',
    textAlign: 'center',
    marginTop: 7,
  },
});
