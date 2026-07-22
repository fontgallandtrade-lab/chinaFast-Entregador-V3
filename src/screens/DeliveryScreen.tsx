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

type Props = NativeStackScreenProps<RootStackParamList, 'Delivery'>;

export default function DeliveryScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Realizar entrega</Text>
        <Text style={styles.text}>Pedido #{orderId}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>DESTINO</Text>
          <Text style={styles.name}>Maria Oliveira</Text>
          <Text style={styles.address}>
            Rua Exemplo, 123 - Centro
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('ValidateDelivery', {
              orderId,
            })
          }
        >
          <Text style={styles.buttonText}>CHEGUEI AO CLIENTE</Text>
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
    padding: 22,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171717',
  },
  text: {
    marginTop: 8,
    color: '#777777',
    fontSize: 15,
  },
  card: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
  },
  label: {
    color: '#777777',
    fontWeight: '800',
    fontSize: 12,
  },
  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '900',
    color: '#222222',
  },
  address: {
    marginTop: 6,
    color: '#555555',
    fontSize: 15,
  },
  button: {
    height: 62,
    borderRadius: 18,
    backgroundColor: '#188642',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
});
