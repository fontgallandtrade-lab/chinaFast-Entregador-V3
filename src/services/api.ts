import AsyncStorage from
  '@react-native-async-storage/async-storage';

import { API_URL } from '../constants/config';

const TOKEN_KEY = '@chinafast:token';
const USER_KEY = '@chinafast:user';

type RequestOptions = RequestInit & {
  authenticated?: boolean;
};

export async function saveSession(
  token: string,
  user: unknown,
): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser<T>(): Promise<T | null> {
  const storedUser = await AsyncStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as T;
  } catch {
    await AsyncStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers,
    ...requestOptions
  } = options;

  const token = authenticated
    ? await getToken()
    : null;

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...headers,
      },
    },
  );

  const rawText = await response.text();

  let data: any = {};

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(
        'A API retornou uma resposta inválida.',
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Erro na comunicação com a API (${response.status}).`,
    );
  }

  return data as T;
}
