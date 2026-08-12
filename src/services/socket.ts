import {
  io,
  Socket,
} from 'socket.io-client';

import {
  getToken,
} from './api';

const SOCKET_URL =
  'https://api.taturanaexpress.com.br';

let socket: Socket | null = null;

let connectedDriverId:
  number | null = null;

async function configureSocketAuth(
  currentSocket: Socket,
): Promise<void> {
  const token =
    await getToken();

  if (!token) {
    throw new Error(
      'Token de autenticação não encontrado.'
    );
  }

  currentSocket.auth = {
    token,
  };
}

function joinDriverRoom(
  currentSocket: Socket,
  driverId: number,
): void {
  /*
   * O driverId continua sendo enviado
   * por compatibilidade temporária.
   *
   * Depois da proteção no backend,
   * o servidor não confiará nesse ID.
   */
  currentSocket.emit(
    'join-driver-room',
    driverId,
  );

  currentSocket.emit(
    'driver-online',
    {
      driverId,
    },
  );

  connectedDriverId =
    driverId;
}

export function getSocket():
Socket {
  if (!socket) {
    socket = io(
      SOCKET_URL,
      {
        transports: [
          'polling',
        ],

        autoConnect:
          false,

        reconnection:
          true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay:
          1000,

        reconnectionDelayMax:
          5000,

        timeout:
          15000,
      },
    );

    socket.on(
      'connect_error',
      error => {
        console.log(
          '[socket] erro:',
          error.message,
        );
      },
    );

    socket.on(
      'disconnect',
      reason => {
        console.log(
          '[socket] desconectado:',
          reason,
        );
      },
    );
  }

  return socket;
}

export async function connectDriverSocket(
  driverId: number,
): Promise<Socket> {
  const currentSocket =
    getSocket();

  await configureSocketAuth(
    currentSocket,
  );

  console.log(
    '[socket] iniciando conexão para driver:',
    driverId,
  );

  currentSocket.off(
    'connect',
  );

  currentSocket.on(
    'connect',
    () => {
      console.log(
        '[socket] conectado:',
        currentSocket.id,
      );

      joinDriverRoom(
        currentSocket,
        driverId,
      );
    },
  );

  if (
    currentSocket.connected
  ) {
    joinDriverRoom(
      currentSocket,
      driverId,
    );
  } else {
    currentSocket.connect();
  }

  return currentSocket;
}

export async function setDriverOnline(
  driverId: number,
): Promise<void> {
  const currentSocket =
    await connectDriverSocket(
      driverId,
    );

  if (
    currentSocket.connected
  ) {
    currentSocket.emit(
      'driver-online',
      {
        driverId,
      },
    );
  }
}

export function setDriverOffline(
  driverId: number,
): void {
  if (!socket?.connected) {
    return;
  }

  socket.emit(
    'driver-offline',
    {
      driverId,
    },
  );
}

export function disconnectDriverSocket():
void {
  if (!socket) {
    return;
  }

  if (
    connectedDriverId &&
    socket.connected
  ) {
    socket.emit(
      'driver-offline',
      {
        driverId:
          connectedDriverId,
      },
    );
  }

  socket.removeAllListeners();
  socket.disconnect();

  socket = null;
  connectedDriverId = null;
}
