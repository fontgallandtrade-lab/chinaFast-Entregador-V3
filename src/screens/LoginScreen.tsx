import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');

  function handleLogin() {
    const normalizedPhone = phone.replace(/\D/g, '');

    if (normalizedPhone.length < 10) {
      Alert.alert(
        'Telefone inválido',
        'Digite um número de telefone com DDD.',
      );
      return;
    }

    navigation.replace('Home');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CF</Text>
          </View>

          <Text style={styles.title}>ChinaFast</Text>
          <Text style={styles.subtitle}>Aplicativo do entregador</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Número de telefone</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(15) 99999-9999"
            placeholderTextColor="#8A8A8A"
            keyboardType="phone-pad"
            maxLength={15}
            style={styles.input}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>ENTRAR</Text>
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Entre com o telefone cadastrado como entregador.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 38,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
    marginBottom: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  title: {
    color: '#161616',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#6A6A6A',
    fontSize: 16,
    marginTop: 6,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  label: {
    color: '#242424',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 9,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#D7DCE1',
    borderRadius: 14,
    paddingHorizontal: 16,
    color: '#161616',
    fontSize: 17,
    backgroundColor: '#FAFAFA',
  },
  button: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
    marginTop: 18,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  helpText: {
    color: '#737373',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
  },
});
