import React from 'react';

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type HelpCardProps = {
  symbol: string;
  title: string;
  text: string;
};

function HelpCard({
  symbol,
  title,
  text,
}: HelpCardProps) {
  return (
    <View style={styles.helpCard}>
      <View style={styles.helpIcon}>
        <Text style={styles.helpIconText}>
          {symbol}
        </Text>
      </View>

      <View style={styles.helpContent}>
        <Text style={styles.helpTitle}>
          {title}
        </Text>

        <Text style={styles.helpText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Central de Ajuda
        </Text>

        <Text style={styles.subtitle}>
          Encontre orientação para os principais
          problemas durante sua operação.
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>
              CENTRAL CHINAFAST
            </Text>

            <Text style={styles.statusText}>
              Área de suporte operacional
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          PRECISO DE AJUDA COM
        </Text>

        <HelpCard
          symbol="R"
          title="Problema com uma corrida"
          text="Dificuldades na coleta, endereço, destinatário, código de segurança ou conclusão da entrega."
        />

        <HelpCard
          symbol="R$"
          title="Pagamento ou carteira"
          text="Consulte saldo, crédito de corridas, saques e outras informações financeiras."
        />

        <HelpCard
          symbol="DOC"
          title="Documentos"
          text="Acompanhe documentos enviados, pendências, reprovações e necessidade de novo envio."
        />

        <HelpCard
          symbol="P"
          title="Conta e cadastro"
          text="Problemas relacionados ao acesso, cadastro, aprovação ou dados pessoais do entregador."
        />

        <HelpCard
          symbol="!"
          title="Segurança operacional"
          text="Em uma situação de risco, priorize sua segurança e interrompa a operação quando necessário."
        />

        <View style={styles.contactCard}>
          <Text style={styles.contactLabel}>
            CONTATO DA CENTRAL
          </Text>

          <Text style={styles.contactTitle}>
            Canal em configuração
          </Text>

          <Text style={styles.contactText}>
            O telefone ou WhatsApp oficial será
            exibido aqui quando for cadastrado.
          </Text>
        </View>

        <Text style={styles.versionText}>
          ChinaFast • Entregador Premium
        </Text>
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

  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#858E97',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 20,
  },

  statusCard: {
    backgroundColor: '#10231A',
    borderWidth: 1,
    borderColor: '#235C3A',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#52E28A',
    marginRight: 12,
  },

  statusContent: {
    flex: 1,
  },

  statusLabel: {
    color: '#52E28A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },

  sectionTitle: {
    color: '#818A94',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 11,
  },

  helpCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
  },

  helpIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#242A31',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  helpIconText: {
    color: '#FF7A16',
    fontSize: 11,
    fontWeight: '900',
  },

  helpContent: {
    flex: 1,
  },

  helpTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  helpText: {
    color: '#8B949E',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  contactCard: {
    backgroundColor: '#171B20',
    borderWidth: 1,
    borderColor: '#2A3037',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },

  contactLabel: {
    color: '#FF7A16',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  contactTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 6,
  },

  contactText: {
    color: '#8B949E',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  versionText: {
    color: '#535B64',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
  },
});
