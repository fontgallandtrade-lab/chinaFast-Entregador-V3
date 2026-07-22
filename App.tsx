import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Etapa =
  | 'indo_coleta'
  | 'codigo_retirada'
  | 'indo_entrega'
  | 'codigo_entrega'
  | 'concluido';

const CODIGO_RETIRADA_TESTE = '12345';
const CODIGO_ENTREGA_TESTE = '54321';

export default function App() {
  const [etapa, setEtapa] = useState<Etapa>('indo_coleta');
  const [codigo, setCodigo] = useState('');
  const [fotoRegistrada, setFotoRegistrada] = useState(false);

  function validarRetirada() {
    Keyboard.dismiss();

    if (codigo.length !== 5) {
      Alert.alert('Código incompleto', 'Digite os cinco números do código.');
      return;
    }

    if (codigo !== CODIGO_RETIRADA_TESTE) {
      Alert.alert('Código incorreto', 'Confira o código informado pela loja.');
      return;
    }

    setCodigo('');
    setEtapa('indo_entrega');
  }

  function validarEntrega() {
    Keyboard.dismiss();

    if (codigo.length !== 5) {
      Alert.alert('Código incompleto', 'Digite os cinco números do código.');
      return;
    }

    if (codigo !== CODIGO_ENTREGA_TESTE) {
      Alert.alert(
        'Código incorreto',
        'Confira o código informado pelo destinatário.',
      );
      return;
    }

    if (!fotoRegistrada) {
      Alert.alert(
        'Foto obrigatória',
        'Registre pelo menos uma foto para confirmar a entrega.',
      );
      return;
    }

    setEtapa('concluido');
  }

  function reiniciar() {
    setCodigo('');
    setFotoRegistrada(false);
    setEtapa('indo_coleta');
  }

  if (etapa === 'indo_coleta') {
    return (
      <TelaNavegacao
        destino="Dellys Lanches"
        endereco="R. Benedito Nunes, 185"
        tempo="4 min"
        distancia="1,6 km"
        tituloBotao="CHEGUEI PARA COLETA"
        tipo="coleta"
        aoConfirmar={() => {
          setCodigo('');
          setEtapa('codigo_retirada');
        }}
      />
    );
  }

  if (etapa === 'indo_entrega') {
    return (
      <TelaNavegacao
        destino="Maria Oliveira"
        endereco="R. João Peixoto, 420"
        tempo="7 min"
        distancia="3,2 km"
        tituloBotao="CHEGUEI AO DESTINO"
        tipo="entrega"
        aoConfirmar={() => {
          setCodigo('');
          setEtapa('codigo_entrega');
        }}
      />
    );
  }

  if (etapa === 'codigo_retirada') {
    return (
      <TelaCodigo
        titulo="Validar retirada"
        instrucao="Peça o código de retirada para a loja"
        codigo={codigo}
        setCodigo={setCodigo}
        textoAjuda="A loja não recebeu o código de retirada?"
        tituloBotao="VALIDAR RETIRADA"
        aoVoltar={() => setEtapa('indo_coleta')}
        aoConfirmar={validarRetirada}
      />
    );
  }

  if (etapa === 'codigo_entrega') {
    return (
      <TelaCodigo
        titulo="Validar entrega"
        instrucao="Peça o código de entrega ao destinatário"
        codigo={codigo}
        setCodigo={setCodigo}
        textoAjuda="O destinatário não recebeu o código de entrega?"
        tituloBotao="CONFIRMAR ENTREGA"
        exigirFoto
        fotoRegistrada={fotoRegistrada}
        aoTirarFoto={() => {
          setFotoRegistrada(true);
          Alert.alert(
            'Foto registrada',
            'Nesta primeira versão estamos simulando a câmera.',
          );
        }}
        aoVoltar={() => setEtapa('indo_entrega')}
        aoConfirmar={validarEntrega}
      />
    );
  }

  return (
    <SafeAreaView style={styles.concluidoContainer}>
      <StatusBar style="light" />

      <View style={styles.concluidoIcone}>
        <Text style={styles.concluidoIconeTexto}>✓</Text>
      </View>

      <Text style={styles.concluidoTitulo}>Entrega concluída!</Text>
      <Text style={styles.concluidoSubtitulo}>
        O pedido foi entregue e validado com sucesso.
      </Text>

      <View style={styles.resumoCard}>
        <View style={styles.resumoLinha}>
          <Text style={styles.resumoRotulo}>Pedido</Text>
          <Text style={styles.resumoValor}>#2541</Text>
        </View>

        <View style={styles.divisor} />

        <View style={styles.resumoLinha}>
          <Text style={styles.resumoRotulo}>Ganhos</Text>
          <Text style={styles.ganhoValor}>R$ 18,50</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.botaoPrincipal} onPress={reiniciar}>
        <Text style={styles.botaoPrincipalTexto}>VOLTAR PARA PEDIDOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

type TelaNavegacaoProps = {
  destino: string;
  endereco: string;
  tempo: string;
  distancia: string;
  tituloBotao: string;
  tipo: 'coleta' | 'entrega';
  aoConfirmar: () => void;
};

function TelaNavegacao({
  destino,
  endereco,
  tempo,
  distancia,
  tituloBotao,
  tipo,
  aoConfirmar,
}: TelaNavegacaoProps) {
  return (
    <SafeAreaView style={styles.navegacaoContainer}>
      <StatusBar style="light" />

      <View style={styles.instrucaoSuperior}>
        <Text style={styles.setaInstrucao}>↑</Text>

        <View style={styles.instrucaoTextos}>
          <Text style={styles.instrucaoPequena}>Siga em frente</Text>
          <Text style={styles.instrucaoRua}>R. Benedito Nunes</Text>
        </View>
      </View>

      <View style={styles.mapa}>
        <View style={styles.ruaVertical} />
        <View style={styles.ruaHorizontal} />

        <View style={styles.rotaVertical} />
        <View style={styles.rotaHorizontal} />

        <View style={styles.nomeRua}>
          <Text style={styles.nomeRuaTexto}>R. Benedito Nunes</Text>
        </View>

        <View style={styles.marcador}>
          <Text style={styles.marcadorTexto}>▲</Text>
        </View>

        <View style={styles.velocidade}>
          <Text style={styles.velocidadeNumero}>0</Text>
          <Text style={styles.velocidadeTexto}>km/h</Text>
        </View>

        <View style={styles.mapaMarca}>
          <Text style={styles.mapaMarcaTexto}>ChinaFast Maps</Text>
        </View>
      </View>

      <View style={styles.painelNavegacao}>
        <View style={styles.puxador} />

        <Text style={styles.tempoDistancia}>
          {tempo} · {distancia}
        </Text>

        <Text style={styles.tipoDestino}>
          {tipo === 'coleta' ? 'Local de coleta' : 'Destino da entrega'}
        </Text>

        <Text style={styles.destinoNome}>{destino}</Text>
        <Text style={styles.destinoEndereco}>{endereco}</Text>

        <View style={styles.acoesLinha}>
          <TouchableOpacity style={styles.acaoItem}>
            <Text style={styles.acaoIcone}>💬</Text>
            <Text style={styles.acaoTexto}>Mensagem</Text>
          </TouchableOpacity>

          <View style={styles.separadorVertical} />

          <TouchableOpacity style={styles.acaoItem}>
            <Text style={styles.acaoIcone}>☎</Text>
            <Text style={styles.acaoTexto}>Ligar</Text>
          </TouchableOpacity>

          <View style={styles.separadorVertical} />

          <TouchableOpacity style={styles.acaoItem}>
            <Text style={styles.acaoIcone}>?</Text>
            <Text style={styles.acaoTexto}>Ajuda</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.botaoCheguei} onPress={aoConfirmar}>
          <View style={styles.botaoChegueiIcone}>
            <Text style={styles.botaoChegueiSetas}>»</Text>
          </View>

          <Text style={styles.botaoChegueiTexto}>{tituloBotao}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type TelaCodigoProps = {
  titulo: string;
  instrucao: string;
  codigo: string;
  setCodigo: (valor: string) => void;
  textoAjuda: string;
  tituloBotao: string;
  exigirFoto?: boolean;
  fotoRegistrada?: boolean;
  aoTirarFoto?: () => void;
  aoVoltar: () => void;
  aoConfirmar: () => void;
};

function TelaCodigo({
  titulo,
  instrucao,
  codigo,
  setCodigo,
  textoAjuda,
  tituloBotao,
  exigirFoto = false,
  fotoRegistrada = false,
  aoTirarFoto,
  aoVoltar,
  aoConfirmar,
}: TelaCodigoProps) {
  const inputRef = useRef<TextInput>(null);
  const botaoAtivo =
    codigo.length === 5 && (!exigirFoto || fotoRegistrada === true);

  return (
    <SafeAreaView style={styles.codigoContainer}>
      <StatusBar style="light" />

      <View style={styles.codigoCabecalho}>
        <TouchableOpacity style={styles.voltarBotao} onPress={aoVoltar}>
          <Text style={styles.voltarTexto}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.codigoCabecalhoTitulo}>{titulo}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.codigoConteudo}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.codigoSecao}>
          <Text style={styles.codigoInstrucao}>
            <Text style={styles.obrigatorio}>* </Text>
            {instrucao}
          </Text>

          <TouchableOpacity
            style={styles.caixasCodigo}
            activeOpacity={0.9}
            onPress={() => inputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4].map((indice) => (
              <View
                key={indice}
                style={[
                  styles.caixaCodigo,
                  indice === codigo.length && styles.caixaCodigoAtiva,
                ]}
              >
                <Text style={styles.caixaCodigoTexto}>
                  {codigo[indice] ?? ''}
                </Text>
              </View>
            ))}
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            value={codigo}
            onChangeText={(valor) =>
              setCodigo(valor.replace(/\D/g, '').slice(0, 5))
            }
            keyboardType="number-pad"
            maxLength={5}
            autoFocus
            style={styles.inputOculto}
          />

          <TouchableOpacity>
            <Text style={styles.textoAjuda}>{textoAjuda}</Text>
          </TouchableOpacity>

          <Text style={styles.codigoTeste}>
            Teste: use {exigirFoto ? CODIGO_ENTREGA_TESTE : CODIGO_RETIRADA_TESTE}
          </Text>
        </View>

        {exigirFoto && (
          <View style={styles.fotoSecao}>
            <Text style={styles.fotoTitulo}>
              <Text style={styles.obrigatorio}>* </Text>
              Tire uma foto para validar
            </Text>

            <TouchableOpacity
              style={[
                styles.fotoArea,
                fotoRegistrada && styles.fotoAreaRegistrada,
              ]}
              onPress={aoTirarFoto}
            >
              <Text style={styles.fotoIcone}>
                {fotoRegistrada ? '✓' : '📷'}
              </Text>

              <Text style={styles.fotoAreaTexto}>
                {fotoRegistrada ? 'Foto registrada' : 'Tirar foto'}
              </Text>

              {fotoRegistrada && (
                <Text style={styles.fotoRefazer}>Toque para refazer</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.fotoInformacao}>
              Você precisa tirar pelo menos{' '}
              <Text style={styles.destaqueLaranja}>1 foto</Text>.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.rodapeConfirmacao}>
        <TouchableOpacity
          style={[
            styles.botaoConfirmar,
            !botaoAtivo && styles.botaoConfirmarDesativado,
          ]}
          onPress={aoConfirmar}
          disabled={!botaoAtivo}
        >
          <Text
            style={[
              styles.botaoConfirmarTexto,
              !botaoAtivo && styles.botaoConfirmarTextoDesativado,
            ]}
          >
            {tituloBotao}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navegacaoContainer: {
    flex: 1,
    backgroundColor: '#DBF8EE',
    paddingTop: NativeStatusBar.currentHeight ?? 0,
  },
  instrucaoSuperior: {
    position: 'absolute',
    zIndex: 20,
    top: (NativeStatusBar.currentHeight ?? 0) + 14,
    left: 14,
    right: 14,
    minHeight: 112,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  setaInstrucao: {
    color: '#FFFFFF',
    fontSize: 60,
    lineHeight: 65,
    marginRight: 22,
  },
  instrucaoTextos: {
    flex: 1,
  },
  instrucaoPequena: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '700',
  },
  instrucaoRua: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 2,
  },
  mapa: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#E5ECE8',
  },
  ruaVertical: {
    position: 'absolute',
    width: 84,
    top: 0,
    bottom: 0,
    left: '44%',
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: '#CBD5E1',
  },
  ruaHorizontal: {
    position: 'absolute',
    height: 86,
    left: 0,
    right: 0,
    top: '47%',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#CBD5E1',
  },
  rotaVertical: {
    position: 'absolute',
    width: 12,
    height: '40%',
    left: '49%',
    top: '47%',
    backgroundColor: '#155EEF',
  },
  rotaHorizontal: {
    position: 'absolute',
    height: 12,
    width: '52%',
    left: '49%',
    top: '52%',
    backgroundColor: '#155EEF',
  },
  nomeRua: {
    position: 'absolute',
    left: 24,
    top: '45%',
    backgroundColor: '#063CE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  nomeRuaTexto: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  marcador: {
    position: 'absolute',
    left: '43%',
    top: '65%',
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  marcadorTexto: {
    color: '#2675EA',
    fontSize: 54,
  },
  velocidade: {
    position: 'absolute',
    left: 22,
    bottom: 24,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  velocidadeNumero: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
  },
  velocidadeTexto: {
    color: '#111827',
    fontSize: 12,
  },
  mapaMarca: {
    position: 'absolute',
    left: 24,
    bottom: 115,
  },
  mapaMarcaTexto: {
    color: '#139C7C',
    fontSize: 20,
    fontWeight: '900',
  },
  painelNavegacao: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  puxador: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 10,
  },
  tempoDistancia: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 24,
    fontWeight: '900',
  },
  tipoDestino: {
    textAlign: 'center',
    color: '#0FAD8D',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  destinoNome: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  destinoEndereco: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  acoesLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 17,
    marginBottom: 18,
  },
  acaoItem: {
    flex: 1,
    alignItems: 'center',
  },
  acaoIcone: {
    fontSize: 22,
  },
  acaoTexto: {
    color: '#374151',
    fontSize: 13,
    marginTop: 4,
  },
  separadorVertical: {
    width: 1,
    height: 36,
    backgroundColor: '#D1D5DB',
  },
  botaoCheguei: {
    height: 72,
    borderRadius: 36,
    backgroundColor: '#08B795',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
  },
  botaoChegueiIcone: {
    width: 100,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoChegueiSetas: {
    color: '#08B795',
    fontSize: 36,
    fontWeight: '900',
  },
  botaoChegueiTexto: {
    flex: 1,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
    marginRight: 15,
  },
  codigoContainer: {
    flex: 1,
    backgroundColor: '#101010',
    paddingTop: NativeStatusBar.currentHeight ?? 0,
  },
  codigoCabecalho: {
    minHeight: 78,
    backgroundColor: '#2E2E2E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  voltarBotao: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voltarTexto: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '300',
    lineHeight: 52,
  },
  codigoCabecalhoTitulo: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginLeft: 6,
  },
  codigoConteudo: {
    paddingBottom: 130,
  },
  codigoSecao: {
    backgroundColor: '#303030',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 25,
  },
  codigoInstrucao: {
    color: '#FFFFFF',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
  },
  obrigatorio: {
    color: '#F43F5E',
  },
  caixasCodigo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  caixaCodigo: {
    width: 56,
    height: 72,
    borderRadius: 11,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaCodigoAtiva: {
    borderColor: '#FF7B44',
    borderWidth: 2,
  },
  caixaCodigoTexto: {
    color: '#FFFFFF',
    fontSize: 35,
    fontWeight: '500',
  },
  inputOculto: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  textoAjuda: {
    color: '#FF7B44',
    fontSize: 16,
    marginTop: 27,
    fontWeight: '600',
  },
  codigoTeste: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 12,
  },
  fotoSecao: {
    backgroundColor: '#303030',
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 25,
  },
  fotoTitulo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },
  fotoArea: {
    width: 230,
    height: 220,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#A1A1AA',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    backgroundColor: '#333333',
  },
  fotoAreaRegistrada: {
    borderStyle: 'solid',
    borderColor: '#08B795',
    backgroundColor: '#17483F',
  },
  fotoIcone: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
  },
  fotoAreaTexto: {
    color: '#D4D4D8',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  fotoRefazer: {
    color: '#9FE8D8',
    fontSize: 13,
    marginTop: 6,
  },
  fotoInformacao: {
    color: '#D4D4D8',
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
  destaqueLaranja: {
    color: '#FF7B44',
    fontWeight: '900',
  },
  rodapeConfirmacao: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#303030',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  botaoConfirmar: {
    height: 62,
    borderRadius: 19,
    backgroundColor: '#08B795',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoConfirmarDesativado: {
    backgroundColor: '#151515',
  },
  botaoConfirmarTexto: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  botaoConfirmarTextoDesativado: {
    color: '#4B4B4B',
  },
  concluidoContainer: {
    flex: 1,
    backgroundColor: '#0E1726',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  concluidoIcone: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#08B795',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concluidoIconeTexto: {
    color: '#FFFFFF',
    fontSize: 65,
    fontWeight: '900',
  },
  concluidoTitulo: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 25,
  },
  concluidoSubtitulo: {
    color: '#AAB3C0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 9,
  },
  resumoCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 22,
    marginTop: 32,
  },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoRotulo: {
    color: '#AAB3C0',
    fontSize: 16,
  },
  resumoValor: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  ganhoValor: {
    color: '#35D2AE',
    fontSize: 23,
    fontWeight: '900',
  },
  divisor: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 18,
  },
  botaoPrincipal: {
    width: '100%',
    height: 62,
    backgroundColor: '#08B795',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  botaoPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
});
