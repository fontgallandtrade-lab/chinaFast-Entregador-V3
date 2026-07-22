import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [isOnline, setIsOnline] = useState(true);

  function openOrder() {
    navigation.navigate('Order', {
      orderId: 1048,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F5F7" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, entregador</Text>
            <Text style={styles.title}>Pronto para trabalhar?</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>E</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusCard,
            isOnline ? styles.statusOnline : styles.statusOffline,
          ]}
        >
          <View>
            <Text style={styles.statusLabel}>Seu status</Text>
            <Text style={styles.statusText}>
              {isOnline ? 'Você está online' : 'Você está offline'}
            </Text>
          </View>

          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{
              false: '#B5B5B5',
              true: '#48B96D',
            }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.sectionTitle}>Resumo de hoje</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ 145,80</Text>
            <Text style={styles.statLabel}>Ganhos</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
        </View>

        <View style={styles.ratingCard}>
          <View>
            <Text style={styles.ratingTitle}>Sua avaliação</Text>
            <Text style={styles.ratingDescription}>
              Excelente desempenho nas entregas
            </Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingValue}>★ 4,99</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedido disponível</Text>
          <Text style={styles.distanceText}>2,4 km</Text>
        </View>

        {isOnline ? (
          <View style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>NOVO</Text>
              </View>

              <Text style={styles.orderNumber}>Pedido #1048</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeIcons}>
                <View style={styles.pickupDot} />
                <View style={styles.routeLine} />
                <View style={styles.deliveryDot} />
              </View>

              <View style={styles.routeTextContainer}>
                <View style={styles.routeBlock}>
                  <Text style={styles.routeLabel}>RETIRADA</Text>
                  <Text style={styles.routeName}>Dellys Lanches</Text>
                  <Text style={styles.routeAddress}>
                    Avenida principal, Tatuí
                  </Text>
                </View>

                <View style={styles.routeBlock}>
                  <Text style={styles.routeLabel}>ENTREGA</Text>
                  <Text style={styles.routeName}>Maria Oliveira</Text>
                  <Text style={styles.routeAddress}>
                    Jardim Santa Rita, Tatuí
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.paymentLabel}>Você recebe</Text>
                <Text style={styles.paymentValue}>R$ 18,50</Text>
              </View>

              <Text style={styles.estimatedTime}>Estimativa: 32 min</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.acceptButton}
              onPress={openOrder}
            >
              <Text style={styles.acceptButtonText}>VER PEDIDO</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Você está offline</Text>
            <Text style={styles.offlineText}>
              Ative seu status para receber novos pedidos.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Acesso rápido</Text>

        <View style={styles.menuGrid}>
          <MenuItem title="Carteira" symbol="R$" />
          <MenuItem title="Histórico" symbol="H" />
          <MenuItem title="Perfil" symbol="P" />
          <MenuItem title="Suporte" symbol="?" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type MenuItemProps = {
  title: string;
  symbol: string;
};

function MenuItem({ title, symbol }: MenuItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.menuItem}>
      <View style={styles.menuIcon}>
        <Text style={styles.menuIconText}>{symbol}</Text>
      </View>

      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F7',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  greeting: {
    color: '#666666',
    fontSize: 15,
  },
  title: {
    color: '#171717',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6A00',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  statusCard: {
    minHeight: 86,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  statusOnline: {
    backgroundColor: '#E9F8EE',
  },
  statusOffline: {
    backgroundColor: '#EBEDF0',
  },
  statusLabel: {
    color: '#606060',
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#1C1C1C',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    justifyContent: 'center',
    elevation: 2,
  },
  statValue: {
    color: '#171717',
    fontSize: 21,
    fontWeight: '900',
  },
  statLabel: {
    color: '#777777',
    fontSize: 14,
    marginTop: 6,
  },
  ratingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 12,
    marginBottom: 27,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  ratingTitle: {
    color: '#202020',
    fontSize: 16,
    fontWeight: '800',
  },
  ratingDescription: {
    color: '#777777',
    fontSize: 12,
    marginTop: 5,
  },
  ratingBadge: {
    backgroundColor: '#FFF3D5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ratingValue: {
    color: '#9A6900',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  distanceText: {
    color: '#FF6A00',
    fontSize: 14,
    fontWeight: '800',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 18,
    marginBottom: 28,
    elevation: 4,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderBadge: {
    backgroundColor: '#FF6A00',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  orderNumber: {
    color: '#4E4E4E',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeIcons: {
    alignItems: 'center',
    width: 24,
    paddingTop: 4,
  },
  pickupDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#FF6A00',
  },
  routeLine: {
    width: 2,
    height: 63,
    backgroundColor: '#DADADA',
  },
  deliveryDot: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: '#222222',
  },
  routeTextContainer: {
    flex: 1,
    paddingLeft: 10,
  },
  routeBlock: {
    minHeight: 80,
  },
  routeLabel: {
    color: '#8B8B8B',
    fontSize: 11,
    fontWeight: '800',
  },
  routeName: {
    color: '#202020',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  routeAddress: {
    color: '#777777',
    fontSize: 13,
    marginTop: 3,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    marginTop: 6,
    paddingTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    color: '#777777',
    fontSize: 12,
  },
  paymentValue: {
    color: '#188642',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  estimatedTime: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '700',
  },
  acceptButton: {
    height: 54,
    backgroundColor: '#FF6A00',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  offlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    alignItems: 'center',
  },
  offlineTitle: {
    color: '#242424',
    fontSize: 18,
    fontWeight: '900',
  },
  offlineText: {
    color: '#777777',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 7,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '48%',
    minHeight: 104,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'space-between',
    elevation: 2,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFF0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    color: '#FF6A00',
    fontSize: 14,
    fontWeight: '900',
  },
  menuTitle: {
    color: '#242424',
    fontSize: 15,
    fontWeight: '800',
  },
});
