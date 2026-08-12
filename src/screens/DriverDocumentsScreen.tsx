import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker
  from 'expo-image-picker';

import {
  File,
} from 'expo-file-system';

import {
  fetch as expoFetch,
} from 'expo/fetch';

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import {
  API_URL,
} from '../constants/config';

import {
  getToken,
} from '../services/api';

import type {
  RootStackParamList,
} from '../types/navigation';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'DriverDocuments'
  >;

type DocumentKey =
  | 'cnh_front'
  | 'cnh_back'
  | 'selfie'
  | 'crlv';

type SelectedImage = {
  uri: string;
  mimeType: string;
  fileName: string;
};

type ServerDocument = {
  id: number;
  document_type:
    DocumentKey;

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  rejection_reason:
    string | null;

  reviewed_at?:
    string | null;
};

type DocumentsResponse = {
  success: boolean;

  approval_status:
    string;

  documents:
    ServerDocument[];

  vehicles:
    Array<{
      id: number;
      document_status:
        string;
      rejection_reason:
        string | null;
    }>;
};

const documentKeys:
DocumentKey[] = [
  'cnh_front',
  'cnh_back',
  'selfie',
  'crlv',
];

const labels:
Record<DocumentKey, string> = {
  cnh_front:
    'CNH - Frente',

  cnh_back:
    'CNH - Verso',

  selfie:
    'Selfie do entregador',

  crlv:
    'CRLV / Documento da moto',
};

function statusLabel(
  status?: string,
) {
  switch (status) {
    case 'approved':
      return 'APROVADO';

    case 'rejected':
      return 'REJEITADO';

    case 'pending':
      return 'EM ANÁLISE';

    default:
      return 'NÃO ENVIADO';
  }
}

export default function DriverDocumentsScreen({
  navigation,
}: Props) {
  const [
    documents,
    setDocuments,
  ] =
    useState<
      Partial<
        Record<
          DocumentKey,
          SelectedImage
        >
      >
    >({});

  const [
    serverDocuments,
    setServerDocuments,
  ] =
    useState<
      Partial<
        Record<
          DocumentKey,
          ServerDocument
        >
      >
    >({});

  const [
    approvalStatus,
    setApprovalStatus,
  ] =
    useState('');

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingStatus,
    setLoadingStatus,
  ] =
    useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoadingStatus(true);

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          'Sessão não encontrada. Faça login novamente.',
        );
      }

      const response =
        await expoFetch(
          `${API_URL}/driver/documents`,
          {
            method:
              'GET',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const raw =
        await response.text();

      let data:
        DocumentsResponse;

      try {
        data =
          raw
            ? JSON.parse(raw)
            : {
                success:
                  false,

                approval_status:
                  '',

                documents:
                  [],

                vehicles:
                  [],
              };
      } catch {
        throw new Error(
          'Resposta inválida da API.',
        );
      }

      if (!response.ok) {
        throw new Error(
          (data as any)?.message ||
          'Não foi possível carregar seus documentos.',
        );
      }

      setApprovalStatus(
        data.approval_status ||
        '',
      );

      const mapped:
        Partial<
          Record<
            DocumentKey,
            ServerDocument
          >
        > = {};

      for (
        const document
        of data.documents || []
      ) {
        mapped[
          document.document_type
        ] =
          document;
      }

      setServerDocuments(
        mapped,
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os documentos.',
      );
    } finally {
      setLoadingStatus(
        false,
      );
    }
  }

  async function chooseImage(
    key: DocumentKey,
  ) {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso às fotos para escolher o documento.',
      );

      return;
    }

    const result =
      await ImagePicker
        .launchImageLibraryAsync({
          mediaTypes:
            ['images'],

          allowsEditing:
            false,

          quality:
            0.85,
        });

    if (
      result.canceled ||
      !result.assets?.[0]
    ) {
      return;
    }

    const asset =
      result.assets[0];

    setDocuments(
      current => ({
        ...current,

        [key]: {
          uri:
            asset.uri,

          mimeType:
            asset.mimeType ||
            'image/jpeg',

          fileName:
            asset.fileName ||
            `${key}.jpg`,
        },
      }),
    );
  }

  async function takePhoto(
    key: DocumentKey,
  ) {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à câmera para tirar a foto.',
      );

      return;
    }

    const result =
      await ImagePicker
        .launchCameraAsync({
          mediaTypes:
            ['images'],

          allowsEditing:
            false,

          quality:
            0.85,
        });

    if (
      result.canceled ||
      !result.assets?.[0]
    ) {
      return;
    }

    const asset =
      result.assets[0];

    setDocuments(
      current => ({
        ...current,

        [key]: {
          uri:
            asset.uri,

          mimeType:
            asset.mimeType ||
            'image/jpeg',

          fileName:
            asset.fileName ||
            `${key}.jpg`,
        },
      }),
    );
  }

  function getDocumentsToSend():
  DocumentKey[] {
    const rejected =
      documentKeys.filter(
        key =>
          serverDocuments[key]
            ?.status ===
          'rejected',
      );

    if (
      rejected.length > 0
    ) {
      return rejected;
    }

    return documentKeys.filter(
      key =>
        !serverDocuments[key],
    );
  }

  async function sendDocuments() {
    const required =
      getDocumentsToSend();

    if (
      required.length === 0
    ) {
      Alert.alert(
        'Nenhuma correção necessária',
        'Não existem documentos rejeitados para reenviar.',
      );

      return;
    }

    const missing =
      required.filter(
        key =>
          !documents[key],
      );

    if (
      missing.length > 0
    ) {
      const names =
        missing
          .map(
            key =>
              labels[key],
          )
          .join(', ');

      Alert.alert(
        'Documentos faltando',
        `Selecione os documentos que precisam ser corrigidos: ${names}.`,
      );

      return;
    }

    try {
      setLoading(true);

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          'Sessão não encontrada. Faça login novamente.',
        );
      }

      const form =
        new FormData();

      for (
        const key
        of required
      ) {
        const selected =
          documents[key];

        if (!selected) {
          continue;
        }

        const file =
          new File(
            selected.uri,
          );

        form.append(
          key,
          file,
        );
      }

      const response =
        await expoFetch(
          `${API_URL}/driver/documents`,
          {
            method:
              'POST',

            headers: {
              Accept:
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              form,
          },
        );

      const raw =
        await response.text();

      let data:
        any = {};

      try {
        data =
          raw
            ? JSON.parse(raw)
            : {};
      } catch {
        throw new Error(
          'Resposta inválida da API.',
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          `Não foi possível reenviar os documentos (${response.status}).`,
        );
      }

      Alert.alert(
        'Documentos reenviados',
        'As correções foram enviadas. Seu cadastro voltou para análise.',
        [
          {
            text:
              'OK',

            onPress: () =>
              navigation.replace(
                'Login',
              ),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Erro no envio',
        error instanceof Error
          ? error.message
          : 'Não foi possível reenviar os documentos.',
      );
    } finally {
      setLoading(false);
    }
  }

  function DocumentCard({
    documentKey,
  }: {
    documentKey:
      DocumentKey;
  }) {
    const selected =
      documents[
        documentKey
      ];

    const current =
      serverDocuments[
        documentKey
      ];

    const status =
      current?.status;

    const canReplace =
      status ===
        'rejected' ||
      !current;

    return (
      <View
        style={[
          styles.documentCard,

          status ===
            'rejected' &&
            styles.rejectedCard,

          status ===
            'approved' &&
            styles.approvedCard,
        ]}
      >
        <View
          style={
            styles.documentHeader
          }
        >
          <Text
            style={
              styles.documentTitle
            }
          >
            {
              labels[
                documentKey
              ]
            }
          </Text>

          <View
            style={[
              styles.statusBadge,

              status ===
                'approved' &&
                styles.statusApproved,

              status ===
                'rejected' &&
                styles.statusRejected,

              status ===
                'pending' &&
                styles.statusPending,
            ]}
          >
            <Text
              style={
                styles.statusText
              }
            >
              {
                statusLabel(
                  status,
                )
              }
            </Text>
          </View>
        </View>

        {status ===
          'rejected' &&
          current
            ?.rejection_reason ? (
          <View
            style={
              styles.rejectionBox
            }
          >
            <Text
              style={
                styles.rejectionTitle
              }
            >
              Motivo da rejeição
            </Text>

            <Text
              style={
                styles.rejectionText
              }
            >
              {
                current
                  .rejection_reason
              }
            </Text>
          </View>
        ) : null}

        {status ===
          'approved' ? (
          <View
            style={
              styles.approvedMessage
            }
          >
            <Text
              style={
                styles.approvedText
              }
            >
              ✓ Documento aprovado.
              Não é necessário
              reenviar.
            </Text>
          </View>
        ) : status ===
          'pending' ? (
          <View
            style={
              styles.pendingMessage
            }
          >
            <Text
              style={
                styles.pendingText
              }
            >
              ⏳ Documento em análise.
            </Text>
          </View>
        ) : selected ? (
          <>
            <Image
              source={{
                uri:
                  selected.uri,
              }}
              style={
                styles.preview
              }
            />

            <Text
              style={
                styles.selectedText
              }
            >
              ✓ Nova imagem
              selecionada
            </Text>
          </>
        ) : (
          <View
            style={
              styles.emptyPreview
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              📷
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              {status ===
              'rejected'
                ? 'Selecione uma nova imagem'
                : 'Nenhum arquivo selecionado'}
            </Text>
          </View>
        )}

        {canReplace ? (
          <View
            style={
              styles.actions
            }
          >
            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={() =>
                takePhoto(
                  documentKey,
                )
              }
              disabled={
                loading
              }
            >
              <Text
                style={
                  styles.secondaryText
                }
              >
                CÂMERA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={() =>
                chooseImage(
                  documentKey,
                )
              }
              disabled={
                loading
              }
            >
              <Text
                style={
                  styles.secondaryText
                }
              >
                UPLOAD
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  if (loadingStatus) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#63C132"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Carregando documentos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const rejectedCount =
    documentKeys.filter(
      key =>
        serverDocuments[key]
          ?.status ===
        'rejected',
    ).length;

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.logo
          }
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
          style={
            styles.title
          }
        >
          {rejectedCount > 0
            ? 'Corrigir documentos'
            : 'Seus documentos'}
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          ChinaFast
        </Text>

        <Text
          style={
            styles.description
          }
        >
          {rejectedCount > 0
            ? 'Confira o motivo da rejeição e envie uma nova imagem somente dos documentos solicitados.'
            : 'Acompanhe aqui a situação dos documentos enviados.'}
        </Text>

        {approvalStatus ? (
          <View
            style={
              styles.generalStatus
            }
          >
            <Text
              style={
                styles.generalStatusLabel
              }
            >
              Situação do cadastro
            </Text>

            <Text
              style={
                styles.generalStatusValue
              }
            >
              {
                approvalStatus ===
                'rejected'
                  ? 'REJEITADO — CORREÇÃO NECESSÁRIA'
                  : approvalStatus ===
                    'pending'
                  ? 'EM ANÁLISE'
                  : approvalStatus ===
                    'approved'
                  ? 'APROVADO'
                  : approvalStatus
                      .toUpperCase()
              }
            </Text>
          </View>
        ) : null}

        <DocumentCard
          documentKey=
            "cnh_front"
        />

        <DocumentCard
          documentKey=
            "cnh_back"
        />

        <DocumentCard
          documentKey=
            "selfie"
        />

        <DocumentCard
          documentKey=
            "crlv"
        />

        {rejectedCount > 0 ? (
          <TouchableOpacity
            style={[
              styles.submitButton,

              loading &&
                styles.disabled,
            ]}
            disabled={
              loading
            }
            onPress={
              sendDocuments
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
                REENVIAR CORREÇÕES
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={
            styles.backButton
          }
          disabled={
            loading
          }
          onPress={() =>
            navigation.replace(
              'Login',
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            VOLTAR AO LOGIN
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.securityText
          }
        >
          🔒 Seus documentos
          são utilizados somente
          para análise do cadastro.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      '#F4F6F8',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  loadingText: {
    marginTop: 15,
    color: '#666666',
    fontSize: 15,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor:
      '#111111',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent:
      'center',
    marginTop: 15,
  },

  logoText: {
    fontSize: 38,
  },

  title: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
  },

  subtitle: {
    color: '#63C132',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },

  description: {
    color: '#6A6A6A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  generalStatus: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 18,
  },

  generalStatusLabel: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },

  generalStatusValue: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },

  documentCard: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor:
      '#EEEEEE',
  },

  rejectedCard: {
    borderColor:
      '#E53935',
    borderWidth: 2,
  },

  approvedCard: {
    borderColor:
      '#63C132',
  },

  documentHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  documentTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '900',
    flex: 1,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor:
      '#777777',
  },

  statusApproved: {
    backgroundColor:
      '#63C132',
  },

  statusRejected: {
    backgroundColor:
      '#E53935',
  },

  statusPending: {
    backgroundColor:
      '#E5A000',
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  rejectionBox: {
    backgroundColor:
      '#FFF1F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  rejectionTitle: {
    color: '#C62828',
    fontWeight: '900',
    fontSize: 13,
  },

  rejectionText: {
    color: '#7F1D1D',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },

  approvedMessage: {
    backgroundColor:
      '#F1F9ED',
    borderRadius: 12,
    padding: 15,
  },

  approvedText: {
    color: '#438A20',
    fontWeight: '800',
  },

  pendingMessage: {
    backgroundColor:
      '#FFF8E1',
    borderRadius: 12,
    padding: 15,
  },

  pendingText: {
    color: '#9A6D00',
    fontWeight: '800',
  },

  preview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    resizeMode: 'cover',
  },

  selectedText: {
    color: '#438A20',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyPreview: {
    height: 150,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle:
      'dashed',
    borderColor:
      '#C9CED3',
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      '#FAFAFA',
  },

  emptyIcon: {
    fontSize: 34,
  },

  emptyText: {
    color: '#777777',
    marginTop: 7,
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor:
      '#63C132',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  secondaryText: {
    color: '#4B9C27',
    fontSize: 13,
    fontWeight: '900',
  },

  submitButton: {
    minHeight: 58,
    backgroundColor:
      '#63C132',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent:
      'center',
    marginTop: 8,
  },

  disabled: {
    opacity: 0.6,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  backButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      '#C9CED3',
    alignItems: 'center',
    justifyContent:
      'center',
    marginTop: 12,
  },

  backButtonText: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '900',
  },

  securityText: {
    color: '#777777',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
});
