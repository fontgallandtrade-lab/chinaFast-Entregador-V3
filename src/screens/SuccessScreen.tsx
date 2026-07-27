import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
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
  'Success'
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

export default function SuccessScreen({
  route,
  navigation,
}: Props) {
  const { orderId } = route.params;

  const [delivery, setDelivery] =
    useState<Delivery | null>(null);

  const [loading, setLoading] =
    useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        try {
          const result =
            await deliveryService.getById(
              orderId,
            );

          setDelivery(result);
        } finally {
          setLoading(false);
        }
      }

      load();
    }, [orderId]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.check}>
          <Text style={styles.checkText}>
            ✓
          </Text>
        </View>

        <Text style={styles.title}>
          Entrega concluída!
        </Text>

        <Text style={styles.text}>
          A corrida foi finalizada com sucesso.
        </Text>

        {loading ? (
          <ActivityIndicator
            color="#188642"
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.code}>
              {delivery?.public_code ||
                `Pedido #${orderId}`}
            </Text>

            <View style={styles.valueCard}>
              <Text style={styles.valueLabel}>
                VALOR CREDITADO
              </Text>

              <Text style={styles.value}>
                {formatCurrency(
                  delivery?.driver_amount || 0,
                )}
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.popToTop()
          }
        >
          <Text style={styles.buttonText}>
            VOLTAR AO INÍCIO
          </Text>
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

  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#188642',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkText: {
    color: '#FFFFFF',
    fontSize: 50,
    fontWeight: '900',
  },

  title: {
    color: '#171717',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 25,
  },

  text: {
    color: '#777777',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 9,
  },

  loader: {
    marginTop: 28,
  },

  code: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
  },

  valueCard: {
    width: '100%',
    backgroundColor: '#EAF8EF',
    borderRadius: 20,
    padding: 22,
    marginTop: 16,
    alignItems: 'center',
  },

  valueLabel: {
    color: '#50735B',
    fontSize: 12,
    fontWeight: '900',
  },

  value: {
    color: '#188642',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 5,
  },

  button: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
