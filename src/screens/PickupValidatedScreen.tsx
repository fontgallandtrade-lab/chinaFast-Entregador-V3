import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
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
  'PickupValidated'
>;

export default function PickupValidatedScreen({
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

  async function beginDelivery() {
    if (
      delivery?.status === 'picked_up'
    ) {
      await deliveryService.updateStatus(
        orderId,
        'in_transit',
      );
    }

    navigation.replace('Delivery', {
      orderId,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0D0D0D"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Retirada validada
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.outer}>
          <View style={styles.inner}>
            <Text style={styles.check}>
              ✓
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          Código verificado!
        </Text>

        <Text style={styles.subtitle}>
          Retirada validada com sucesso.
        </Text>

        {loading ? (
          <ActivityIndicator
            color="#0DB690"
            style={styles.loader}
          />
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Encomenda retirada
              </Text>

              <Text style={styles.cardText}>
                {delivery?.pickup_city ||
                  'Local de retirada'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Próximo destino
              </Text>

              <Text style={styles.cardText}>
                {delivery?.destination_city ||
                  'Endereço de entrega'}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={beginDelivery}
        >
          <Text style={styles.buttonText}>
            INICIAR ENTREGA
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  header: {
    height: 112,
    backgroundColor: '#202020',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },

  body: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    paddingTop: 60,
  },

  outer: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(13,182,144,.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inner: {
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: '#0DB690',
    borderWidth: 21,
    borderColor: '#087D65',
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 62,
    fontWeight: '900',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 34,
  },

  subtitle: {
    color: '#A5A5A5',
    fontSize: 17,
    marginTop: 10,
  },

  loader: {
    marginTop: 35,
  },

  card: {
    width: '100%',
    minHeight: 95,
    borderRadius: 20,
    backgroundColor: '#222222',
    marginTop: 22,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  cardText: {
    color: '#A8A8A8',
    fontSize: 15,
    marginTop: 7,
  },

  footer: {
    paddingHorizontal: 30,
    paddingBottom: 34,
  },

  button: {
    height: 70,
    borderRadius: 20,
    backgroundColor: '#079D72',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
