import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Success'>;

export default function SuccessScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.check}>
          <Text style={styles.checkText}>✓</Text>
        </View>

        <Text style={styles.title}>Entrega concluída!</Text>
        <Text style={styles.text}>
          O pedido #{orderId} foi finalizado com sucesso.
        </Text>

        <Text style={styles.value}>+ R$ 18,50</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.buttonText}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7' },
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
  checkText: { color: '#FFFFFF', fontSize: 50, fontWeight: '900' },
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
  value: {
    color: '#188642',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 24,
  },
  button: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
