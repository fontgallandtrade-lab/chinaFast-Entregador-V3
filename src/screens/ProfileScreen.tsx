import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  profileService,
  type DriverProfile,
} from '../services/profile';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'Profile'
  >;

function approvalLabel(
  status?: string,
): string {
  switch (status) {
    case 'approved':
      return 'APROVADO';

    case 'pending':
      return 'EM ANÁLISE';

    case 'rejected':
      return 'REPROVADO';

    case 'suspended':
      return 'SUSPENSO';

    default:
      return String(
        status || 'NÃO INFORMADO',
      ).toUpperCase();
  }
}

export default function ProfileScreen({
  navigation,
}: Props) {
  const [profile, setProfile] =
    useState<DriverProfile | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadProfile = useCallback(
    async () => {
      try {
        setError(null);

        const result =
          await profileService.getProfile();

        setProfile(result);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar o perfil.',
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfile();
    }, [loadProfile]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#FF6A00"
          />

          <Text style={styles.loadingText}>
            Carregando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Não foi possível carregar
          </Text>

          <Text style={styles.errorText}>
            {error ||
              'Perfil não encontrado.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name
                ?.trim()
                .charAt(0)
                .toUpperCase() || 'E'}
            </Text>
          </View>

          <View style={styles.heroText}>
            <Text style={styles.name}>
              {profile.name}
            </Text>

            <Text style={styles.email}>
              {profile.email}
            </Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.label}>
              STATUS DO CADASTRO
            </Text>

            <Text style={styles.statusValue}>
              {approvalLabel(
                profile.approval_status,
              )}
            </Text>
          </View>

          <View style={styles.onlineBlock}>
            <View
              style={[
                styles.dot,
                profile.online
                  ? styles.dotOnline
                  : styles.dotOffline,
              ]}
            />

            <Text style={styles.onlineText}>
              {profile.online
                ? 'ONLINE'
                : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            DADOS DO ENTREGADOR
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Telefone
            </Text>

            <Text style={styles.infoValue}>
              {profile.phone ||
                'Não informado'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Avaliação
            </Text>

            <Text style={styles.infoValue}>
              {Number(
                profile.rating || 0,
              ).toFixed(1)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Conta
            </Text>

            <Text style={styles.infoValue}>
              {profile.user_status ||
                'Ativa'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.documentsButton}
          onPress={() =>
            navigation.navigate(
              'DriverDocuments',
            )
          }
        >
          <View>
            <Text style={styles.buttonLabel}>
              DOCUMENTOS
            </Text>

            <Text style={styles.buttonTitle}>
              Ver cadastro e documentos
            </Text>
          </View>

          <Text style={styles.arrow}>
            ›
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D10',
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    color: '#8B949E',
    marginTop: 12,
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  errorText: {
    color: '#8B949E',
    textAlign: 'center',
    marginTop: 8,
  },

  heroCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  heroText: {
    flex: 1,
  },

  name: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  email: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 4,
  },

  statusCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  label: {
    color: '#7E8791',
    fontSize: 9,
    fontWeight: '900',
  },

  statusValue: {
    color: '#52E28A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },

  onlineBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  dotOnline: {
    backgroundColor: '#52E28A',
  },

  dotOffline: {
    backgroundColor: '#68717A',
  },

  onlineText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  infoCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#FF7A16',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLabel: {
    color: '#8B949E',
    fontSize: 12,
  },

  infoValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: '#2A3037',
    marginVertical: 13,
  },

  documentsButton: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  buttonLabel: {
    color: '#FF7A16',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  buttonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },

  arrow: {
    color: '#FF6A00',
    fontSize: 34,
  },
});
