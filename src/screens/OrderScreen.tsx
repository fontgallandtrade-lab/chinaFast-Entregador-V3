import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Order'>;

export default function OrderScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>PEDIDO DISPONÍVEL</Text>
        <Text style={styles.title}>Pedido #{orderId}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Retirada</Text>
          <Text style={styles.name}>Dellys Lanches</Text>
          <Text style={styles.address}>
            Avenida principal, Tatuí - SP
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Entrega</Text>
          <Text style={styles.name}>Maria Oliveira</Text>
          <Text style={styles.address}>
            Jardim Santa Rita, Tatuí - SP
          </Text>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.paymentLabel}>Valor da entrega</Text>
          <Text style={styles.paymentValue}>R$ 18,50</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.acceptButton}
          onPress={() =>
            navigation.navigate('Pickup', {
              orderId,
            })
          }
        >
          <Text style={styles.acceptButtonText}>ACEITAR ENTREGA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.rejectButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.rejectButtonText}>RECUSAR</Text>
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
    padding: 20,
  },
  label: {
    color: '#FF6A00',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
  },
  title: {
    color: '#171717',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 7,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 3,
  },
  sectionLabel: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    color: '#202020',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 5,
  },
  address: {
    color: '#777777',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 20,
  },
  paymentCard: {
    backgroundColor: '#EAF8EF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
  },
  paymentLabel: {
    color: '#50735B',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentValue: {
    color: '#188642',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 3,
  },
  acceptButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
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
