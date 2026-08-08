import React, {
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
    loading,
    setLoading,
  ] =
    useState(false);

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

  async function sendDocuments() {
    const required:
      DocumentKey[] = [
        'cnh_front',
        'cnh_back',
        'selfie',
        'crlv',
      ];

    const missing =
      required.filter(
        key =>
          !documents[key],
      );

    if (
      missing.length > 0
    ) {
      Alert.alert(
        'Documentos faltando',
        'Envie CNH frente, CNH verso, selfie e CRLV.',
      );

      return;
    }

    try {
      setLoading(true);

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          'Sessão não encontrada. Faça o cadastro novamente.',
        );
      }

      const form =
        new FormData();

      for (
        const key
        of required
      ) {
        const file =
          documents[key]!;

        form.append(
          key,
          {
            uri:
              file.uri,

            name:
              file.fileName,

            type:
              file.mimeType,
          } as any,
        );
      }

      const response =
        await fetch(
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
          'Não foi possível enviar os documentos.',
        );
      }

      Alert.alert(
        'Documentos enviados',
        'Seu cadastro está em análise. Você será liberado após a aprovação.',
        [
          {
            text: 'OK',

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
          : 'Não foi possível enviar os documentos.',
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

    return (
      <View
        style={
          styles.documentCard
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

        {selected ? (
          <Image
            source={{
              uri:
                selected.uri,
            }}
            style={
              styles.preview
            }
          />
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
              Nenhum arquivo
              selecionado
            </Text>
          </View>
        )}

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
      </View>
    );
  }

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
          Envie seus documentos
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
          Precisamos confirmar
          seus dados antes de
          liberar sua conta para
          receber entregas.
        </Text>

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
              ENVIAR PARA ANÁLISE
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={
            styles.securityText
          }
        >
          🔒 Seus documentos
          serão utilizados somente
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
      padding:
        20,

      paddingBottom:
        50,
    },

    logo: {
      width:
        72,

      height:
        72,

      borderRadius:
        20,

      backgroundColor:
        '#111111',

      alignSelf:
        'center',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        15,
    },

    logoText: {
      fontSize:
        38,
    },

    title: {
      color:
        '#171717',

      fontSize:
        28,

      fontWeight:
        '900',

      textAlign:
        'center',

      marginTop:
        18,
    },

    subtitle: {
      color:
        '#63C132',

      fontSize:
        17,

      fontWeight:
        '900',

      textAlign:
        'center',

      marginTop:
        4,
    },

    description: {
      color:
        '#6A6A6A',

      fontSize:
        14,

      lineHeight:
        20,

      textAlign:
        'center',

      marginTop:
        10,

      marginBottom:
        20,
    },

    documentCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius:
        20,

      padding:
        16,

      marginBottom:
        16,

      elevation:
        2,
    },

    documentTitle: {
      color:
        '#171717',

      fontSize:
        17,

      fontWeight:
        '900',

      marginBottom:
        12,
    },

    preview: {
      width:
        '100%',

      height:
        180,

      borderRadius:
        14,

      resizeMode:
        'cover',
    },

    emptyPreview: {
      height:
        150,

      borderRadius:
        14,

      borderWidth:
        1,

      borderStyle:
        'dashed',

      borderColor:
        '#C9CED3',

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#FAFAFA',
    },

    emptyIcon: {
      fontSize:
        34,
    },

    emptyText: {
      color:
        '#777777',

      marginTop:
        7,
    },

    actions: {
      flexDirection:
        'row',

      gap:
        10,

      marginTop:
        12,
    },

    secondaryButton: {
      flex:
        1,

      minHeight:
        48,

      borderRadius:
        12,

      borderWidth:
        2,

      borderColor:
        '#63C132',

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    secondaryText: {
      color:
        '#4B9C27',

      fontWeight:
        '900',
    },

    submitButton: {
      minHeight:
        58,

      backgroundColor:
        '#63C132',

      borderRadius:
        15,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop:
        8,
    },

    submitText: {
      color:
        '#FFFFFF',

      fontSize:
        15,

      fontWeight:
        '900',
    },

    disabled: {
      opacity:
        0.65,
    },

    securityText: {
      color:
        '#777777',

      textAlign:
        'center',

      fontSize:
        12,

      lineHeight:
        18,

      marginTop:
        16,
    },
  });
