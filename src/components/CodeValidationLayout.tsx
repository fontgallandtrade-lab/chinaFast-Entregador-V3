import React, {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  title: string;
  instruction: string;
  helpText: string;
  buttonText: string;
  onBack: () => void;
  onValidate: (
    code: string,
  ) => Promise<void>;
};

const CODE_LENGTH = 6;

export default function CodeValidationLayout({
  title,
  instruction,
  helpText,
  buttonText,
  onBack,
  onValidate,
}: Props) {
  const [code, setCode] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const inputRef =
    useRef<TextInput>(null);

  function handleChange(
    value: string,
  ) {
    setCode(
      value
        .replace(/\D/g, '')
        .slice(0, CODE_LENGTH),
    );
  }

  async function validate() {
    if (
      code.length !== CODE_LENGTH ||
      loading
    ) {
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);

      await onValidate(code);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível validar o código.';

      Alert.alert(
        'Código não validado',
        message,
      );

      setCode('');

      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0D0D0D"
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          disabled={loading}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {title}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.formCard}
        onPress={() =>
          inputRef.current?.focus()
        }
      >
        <Text style={styles.instruction}>
          <Text style={styles.required}>
            *{' '}
          </Text>

          {instruction}
        </Text>

        <View style={styles.codeRow}>
          {Array.from({
            length: CODE_LENGTH,
          }).map((_, index) => {
            const active =
              index === code.length &&
              code.length < CODE_LENGTH;

            return (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  active &&
                    styles.codeBoxActive,
                ]}
              >
                <Text
                  style={styles.codeDigit}
                >
                  {code[index] ?? ''}
                </Text>
              </View>
            );
          })}
        </View>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          autoFocus
          editable={!loading}
          style={styles.hiddenInput}
        />

        <Text style={styles.help}>
          {helpText}
        </Text>

        <Text style={styles.securityText}>
          O código possui 6 números e deve ser
          informado pela pessoa responsável.
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={
            code.length !== CODE_LENGTH ||
            loading
          }
          onPress={validate}
          style={[
            styles.button,
            (
              code.length !== CODE_LENGTH ||
              loading
            ) &&
              styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={[
                styles.buttonText,
                code.length !==
                  CODE_LENGTH &&
                  styles.buttonTextDisabled,
              ]}
            >
              {buttonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  header: {
    height: 112,
    backgroundColor: '#2D2D2D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  backButton: {
    width: 58,
    height: 58,
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '300',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  formCard: {
    backgroundColor: '#2D2D2D',
    marginTop: 40,
    paddingHorizontal: 28,
    paddingTop: 42,
    paddingBottom: 38,
  },

  instruction: {
    color: '#FFFFFF',
    fontSize: 25,
    lineHeight: 37,
    fontWeight: '900',
  },

  required: {
    color: '#FF4D6D',
  },

  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 44,
  },

  codeBox: {
    width: 57,
    height: 82,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#454545',
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  codeBoxActive: {
    borderWidth: 3,
    borderColor: '#FF784E',
  },

  codeDigit: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },

  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  help: {
    color: '#FF784E',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 38,
  },

  securityText: {
    color: '#A5A5A5',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 17,
  },

  footer: {
    marginTop: 'auto',
    backgroundColor: '#2D2D2D',
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 34,
  },

  button: {
    height: 70,
    borderRadius: 22,
    backgroundColor: '#FF784E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    backgroundColor: '#151515',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  buttonTextDisabled: {
    color: '#505050',
  },
});
