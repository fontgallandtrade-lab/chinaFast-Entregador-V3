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

type Props = NativeStackScreenProps<RootStackParamList, 'Pickup'>;

export default function PickupScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ir até a retirada</Text>
        <Text style={styles.text}>Pedido #{orderId}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>LOCAL DE RETIRADA</Text>
          <Text style={styles.name}>Dellys Lanches</Text>
          <Text style={styles.address}>R. Benedito Nunes, 185</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('ValidatePickup', { orderId })
          }
        >
          <Text style={styles.buttonText}>CHEGUEI PARA COLETA</Text>
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
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  label: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '800',
  },
  name: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '900',
    color: '#FF6A00',
  },
  address: {
    marginTop: 7,
    color: '#555555',
    fontSize: 15,
  },
  button: {
    height: 62,
    backgroundColor: '#FF6A00',
    borderRadius: 18,
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
