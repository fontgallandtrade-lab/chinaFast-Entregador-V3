import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  authService,
} from '../services/auth';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'RegisterDriver'
  >;

function digits(
  value: string,
): string {
  return value.replace(
    /\D/g,
    '',
  );
}

function formatCpf(
  value: string,
): string {
  const v =
    digits(value).slice(0, 11);

  return v
    .replace(
      /(\d{3})(\d)/,
      '$1.$2',
    )
    .replace(
      /(\d{3})(\d)/,
      '$1.$2',
    )
    .replace(
      /(\d{3})(\d{1,2})$/,
      '$1-$2',
    );
}

function formatPhone(
  value: string,
): string {
  const v =
    digits(value).slice(0, 11);

  if (
    v.length <= 10
  ) {
    return v
      .replace(
        /(\d{2})(\d)/,
        '($1) $2',
      )
      .replace(
        /(\d{4})(\d)/,
        '$1-$2',
      );
  }

  return v
    .replace(
      /(\d{2})(\d)/,
      '($1) $2',
    )
    .replace(
      /(\d{5})(\d)/,
      '$1-$2',
    );
}

function formatPlate(
  value: string,
): string {
  return value
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      '',
    )
    .slice(
      0,
      7,
    );
}

export default function RegisterDriverScreen({
  navigation,
}: Props) {
  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [cpf, setCpf] =
    useState('');

  const [cnhNumber, setCnhNumber] =
    useState('');

  const [cnhExpiration, setCnhExpiration] =
    useState('');

  const [brand, setBrand] =
    useState('');

  const [model, setModel] =
    useState('');

  const [color, setColor] =
    useState('');

  const [plate, setPlate] =
    useState('');

  const [year, setYear] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleRegister() {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !cpf.trim() ||
      !cnhNumber.trim() ||
      !cnhExpiration.trim() ||
      !plate.trim()
    ) {
      Alert.alert(
        'Dados incompletos',
        'Preencha todos os campos obrigatórios.',
      );

      return;
    }

    if (
      password.length < 8
    ) {
      Alert.alert(
        'Senha inválida',
        'A senha deve ter pelo menos 8 caracteres.',
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      Alert.alert(
        'Senhas diferentes',
        'A confirmação da senha não confere.',
      );

      return;
    }

    if (
      digits(cpf).length !== 11
    ) {
      Alert.alert(
        'CPF inválido',
        'Digite um CPF com 11 números.',
      );

      return;
    }

    if (
      digits(cnhNumber).length < 9
    ) {
      Alert.alert(
        'CNH inválida',
        'Confira o número da CNH.',
      );

      return;
    }

    if (
      formatPlate(plate).length !== 7
    ) {
      Alert.alert(
        'Placa inválida',
        'Digite uma placa válida.',
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await authService.registerDriver({
          name,
          email,
          phone:
            digits(phone),

          password,

          document_number:
            digits(cpf),

          cnh_number:
            digits(cnhNumber),

          cnh_expiration:
            cnhExpiration.trim(),

          vehicle_type:
            'motorcycle',

          vehicle_brand:
            brand,

          vehicle_model:
            model,

          vehicle_color:
            color,

          vehicle_plate:
            formatPlate(plate),

          vehicle_year:
            year.trim()
              ? Number(year)
              : null,
        });

      Alert.alert(
        'Cadastro criado',
        'Agora envie sua CNH, selfie e documento da moto.',
        [
          {
            text: 'CONTINUAR',
            onPress: () =>
              navigation.replace(
                'DriverDocuments',
              ),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Não foi possível cadastrar',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao enviar o cadastro.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          <View
            style={
              styles.brandContainer
            }
          >
            <View
              style={styles.logo}
            >
              <Text
                style={
                  styles.logoText
                }
              >
                🐛
              </Text>
            </View>

            <Text
              style={styles.title}
            >
              Quero ser entregador
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Taturana Express
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Preencha seus dados.
              Seu cadastro será
              analisado antes da
              liberação para corridas.
            </Text>
          </View>

          <View
            style={styles.card}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Dados pessoais
            </Text>

            <Text
              style={styles.label}
            >
              Nome completo *
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor="#8A8A8A"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              E-mail *
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor="#8A8A8A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Telefone *
            </Text>

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={
                value =>
                  setPhone(
                    formatPhone(
                      value,
                    ),
                  )
              }
              placeholder="(15) 99999-9999"
              placeholderTextColor="#8A8A8A"
              keyboardType="phone-pad"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              CPF *
            </Text>

            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={
                value =>
                  setCpf(
                    formatCpf(
                      value,
                    ),
                  )
              }
              placeholder="000.000.000-00"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Senha *
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={
                setPassword
              }
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Confirmar senha *
            </Text>

            <TextInput
              style={styles.input}
              value={
                confirmPassword
              }
              onChangeText={
                setConfirmPassword
              }
              placeholder="Digite novamente"
              placeholderTextColor="#8A8A8A"
              secureTextEntry
              editable={!loading}
            />

            <View
              style={
                styles.separator
              }
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              CNH
            </Text>

            <Text
              style={styles.label}
            >
              Número da CNH *
            </Text>

            <TextInput
              style={styles.input}
              value={cnhNumber}
              onChangeText={
                value =>
                  setCnhNumber(
                    digits(value)
                      .slice(
                        0,
                        11,
                      ),
                  )
              }
              placeholder="Número da CNH"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Validade da CNH *
            </Text>

            <TextInput
              style={styles.input}
              value={
                cnhExpiration
              }
              onChangeText={
                setCnhExpiration
              }
              placeholder="AAAA-MM-DD"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="none"
              editable={!loading}
            />

            <Text
              style={
                styles.dateHint
              }
            >
              Exemplo: 2028-12-31
            </Text>

            <View
              style={
                styles.separator
              }
            />

            <Text
              style={
                styles.sectionTitle
              }
            >
              Sua moto
            </Text>

            <Text
              style={styles.label}
            >
              Placa *
            </Text>

            <TextInput
              style={styles.input}
              value={plate}
              onChangeText={
                value =>
                  setPlate(
                    formatPlate(
                      value,
                    ),
                  )
              }
              placeholder="ABC1D23"
              placeholderTextColor="#8A8A8A"
              autoCapitalize="characters"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Marca
            </Text>

            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={
                setBrand
              }
              placeholder="Ex.: Honda"
              placeholderTextColor="#8A8A8A"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Modelo
            </Text>

            <TextInput
              style={styles.input}
              value={model}
              onChangeText={
                setModel
              }
              placeholder="Ex.: CG 160"
              placeholderTextColor="#8A8A8A"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Ano
            </Text>

            <TextInput
              style={styles.input}
              value={year}
              onChangeText={
                value =>
                  setYear(
                    digits(value)
                      .slice(
                        0,
                        4,
                      ),
                  )
              }
              placeholder="Ex.: 2024"
              placeholderTextColor="#8A8A8A"
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text
              style={styles.label}
            >
              Cor
            </Text>

            <TextInput
              style={styles.input}
              value={color}
              onChangeText={
                setColor
              }
              placeholder="Ex.: Preta"
              placeholderTextColor="#8A8A8A"
              editable={!loading}
            />

            <View
              style={
                styles.notice
              }
            >
              <Text
                style={
                  styles.noticeTitle
                }
              >
                Próxima etapa
              </Text>

              <Text
                style={
                  styles.noticeText
                }
              >
                Após enviar os
                dados, também serão
                solicitados CNH,
                selfie e documento
                do veículo para
                aprovação.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.submitButton,
                loading &&
                  styles.disabled,
              ]}
              disabled={loading}
              onPress={
                handleRegister
              }
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.submitText
                  }
                >
                  ENVIAR CADASTRO
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor:
        '#F4F6F8',
    },

    content: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 50,
    },

    backButton: {
      alignSelf:
        'flex-start',
      paddingVertical: 8,
      paddingRight: 15,
    },

    backText: {
      color: '#171717',
      fontSize: 16,
      fontWeight: '800',
    },

    brandContainer: {
      alignItems: 'center',
      marginTop: 15,
      marginBottom: 25,
    },

    logo: {
      width: 78,
      height: 78,
      borderRadius: 22,
      backgroundColor:
        '#111111',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 15,
    },

    logoText: {
      fontSize: 39,
    },

    title: {
      color: '#171717',
      fontSize: 28,
      fontWeight: '900',
      textAlign: 'center',
    },

    subtitle: {
      color: '#63C132',
      fontSize: 18,
      fontWeight: '900',
      marginTop: 5,
    },

    description: {
      color: '#6A6A6A',
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
      marginTop: 10,
      maxWidth: 330,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 24,
      padding: 20,
      elevation: 3,
      shadowColor:
        '#000000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.07,
      shadowRadius: 8,
    },

    sectionTitle: {
      color: '#171717',
      fontSize: 20,
      fontWeight: '900',
      marginBottom: 16,
    },

    label: {
      color: '#292929',
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 12,
    },

    input: {
      minHeight: 54,
      borderWidth: 1,
      borderColor:
        '#D7DCE1',
      borderRadius: 14,
      paddingHorizontal: 15,
      color: '#171717',
      backgroundColor:
        '#FAFAFA',
      fontSize: 16,
    },

    dateHint: {
      color: '#888888',
      fontSize: 12,
      marginTop: 6,
    },

    separator: {
      height: 1,
      backgroundColor:
        '#E8EAED',
      marginVertical: 25,
    },

    notice: {
      backgroundColor:
        '#F1F8EC',
      borderRadius: 15,
      padding: 15,
      marginTop: 24,
    },

    noticeTitle: {
      color: '#438A20',
      fontWeight: '900',
      fontSize: 14,
    },

    noticeText: {
      color: '#55704A',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },

    submitButton: {
      minHeight: 56,
      backgroundColor:
        '#63C132',
      borderRadius: 14,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: 20,
    },

    disabled: {
      opacity: 0.65,
    },

    submitText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },
  });
