import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  walletService,
  type DriverWallet,
  type WalletTransaction,
  type Withdrawal,
} from '../services/wallet';

function money(
  value: number | string,
): string {
  return Number(value || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  );
}

export default function WalletScreen() {
  const [wallet, setWallet] =
    useState<DriverWallet | null>(null);

  const [transactions, setTransactions] =
    useState<WalletTransaction[]>([]);

  const [withdrawals, setWithdrawals] =
    useState<Withdrawal[]>([]);

  const [pixKey, setPixKey] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [withdrawing, setWithdrawing] =
    useState(false);

  const loadWallet =
    useCallback(async () => {
      try {
        const [
          walletData,
          statementData,
          withdrawalsData,
        ] = await Promise.all([
          walletService.getWallet(),
          walletService.getStatement(),
          walletService.getWithdrawals(),
        ]);

        setWallet(walletData);
        setTransactions(statementData);
        setWithdrawals(withdrawalsData);
      } catch (error) {
        Alert.alert(
          'Carteira',
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar a carteira.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWallet();
    }, [loadWallet]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadWallet();
  }

  async function handleWithdrawal() {
    const numericAmount =
      Number(
        amount
          .replace(/\./g, '')
          .replace(',', '.'),
      );

    if (!Number.isFinite(numericAmount)) {
      Alert.alert(
        'Valor inválido',
        'Informe o valor do saque.',
      );
      return;
    }

    if (numericAmount < 50) {
      Alert.alert(
        'Saque mínimo',
        'O saque mínimo é de R$ 50,00.',
      );
      return;
    }

    if (!pixKey.trim()) {
      Alert.alert(
        'Chave Pix',
        'Informe sua chave Pix.',
      );
      return;
    }

    try {
      setWithdrawing(true);

      await walletService.requestWithdrawal(
        numericAmount,
        pixKey,
      );

      Alert.alert(
        'Saque solicitado',
        'Sua solicitação de saque foi enviada.',
      );

      setAmount('');
      await loadWallet();
    } catch (error) {
      Alert.alert(
        'Não foi possível sacar',
        error instanceof Error
          ? error.message
          : 'Erro ao solicitar saque.',
      );
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading && !wallet) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#FF6A00"
        />

        <Text style={styles.loadingText}>
          Carregando carteira...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF6A00']}
          />
        }
      >
        <Text style={styles.pageTitle}>
          Minha carteira
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            SALDO DISPONÍVEL
          </Text>

          <Text style={styles.balanceValue}>
            {money(
              wallet?.available_balance || 0,
            )}
          </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.smallLabel}>
                Pendente
              </Text>

              <Text style={styles.smallValue}>
                {money(
                  wallet?.pending_balance || 0,
                )}
              </Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>
                Total ganho
              </Text>

              <Text style={styles.smallValue}>
                {money(
                  wallet?.total_earned || 0,
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Sacar via Pix
          </Text>

          <Text style={styles.helper}>
            Saque mínimo de R$ 50,00
          </Text>

          <TextInput
            style={styles.input}
            value={pixKey}
            onChangeText={setPixKey}
            placeholder="Chave Pix"
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Valor do saque"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.withdrawButton,
              withdrawing &&
                styles.disabledButton,
            ]}
            disabled={withdrawing}
            onPress={handleWithdrawal}
          >
            {withdrawing ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={styles.withdrawButtonText}
              >
                SACAR AGORA
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          Movimentações recentes
        </Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhuma movimentação ainda.
            </Text>
          </View>
        ) : (
          transactions.slice(0, 10).map(
            transaction => (
              <View
                key={transaction.id}
                style={styles.transaction}
              >
                <View style={styles.transactionText}>
                  <Text style={styles.transactionTitle}>
                    {transaction.description ||
                      transaction.type}
                  </Text>

                  <Text style={styles.transactionCode}>
                    {transaction.reference_code ||
                      'Movimentação'}
                  </Text>
                </View>

                <Text style={styles.transactionValue}>
                  {money(transaction.amount)}
                </Text>
              </View>
            ),
          )
        )}

        <Text style={styles.sectionTitle}>
          Saques
        </Text>

        {withdrawals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum saque solicitado.
            </Text>
          </View>
        ) : (
          withdrawals.slice(0, 10).map(
            withdrawal => (
              <View
                key={withdrawal.id}
                style={styles.transaction}
              >
                <View style={styles.transactionText}>
                  <Text style={styles.transactionTitle}>
                    {withdrawal.public_code}
                  </Text>

                  <Text style={styles.transactionCode}>
                    Status: {withdrawal.status}
                  </Text>
                </View>

                <Text style={styles.transactionValue}>
                  {money(withdrawal.amount)}
                </Text>
              </View>
            ),
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F5F7',
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  loadingText: {
    marginTop: 12,
    color: '#666',
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: '900',
    color: '#171717',
    marginBottom: 18,
  },

  balanceCard: {
    backgroundColor: '#171717',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
  },

  balanceLabel: {
    color: '#BFC3C7',
    fontSize: 12,
    fontWeight: '800',
  },

  balanceValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 7,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  smallLabel: {
    color: '#AEB3B8',
    fontSize: 12,
  },

  smallValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
  },

  cardTitle: {
    color: '#171717',
    fontSize: 19,
    fontWeight: '900',
  },

  helper: {
    color: '#777',
    marginTop: 5,
    marginBottom: 15,
  },

  input: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#F3F5F7',
    paddingHorizontal: 15,
    marginBottom: 12,
    color: '#171717',
    fontSize: 16,
  },

  withdrawButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#FF6A00',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  disabledButton: {
    opacity: 0.65,
  },

  withdrawButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },

  sectionTitle: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 5,
  },

  transaction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  transactionText: {
    flex: 1,
    paddingRight: 12,
  },

  transactionTitle: {
    color: '#171717',
    fontWeight: '800',
    fontSize: 15,
  },

  transactionCode: {
    color: '#777',
    marginTop: 4,
    fontSize: 12,
  },

  transactionValue: {
    color: '#FF6A00',
    fontWeight: '900',
    fontSize: 16,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
  },
});
