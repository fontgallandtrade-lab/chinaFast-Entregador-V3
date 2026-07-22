import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        <Text style={styles.name}>Maria Oliveira</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Success', { orderId })}
        >
          <Text style={styles.buttonText}>CONFIRMAR ENTREGA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7' },
  content: { flex: 1, padding: 22 },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  text: { marginTop: 8, color: '#777777', fontSize: 15 },
  name: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: '900',
    color: '#222222',
  },
  button: {
    height: 58,
    backgroundColor: '#188642',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
