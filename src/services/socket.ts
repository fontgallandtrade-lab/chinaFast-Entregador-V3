import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  'https://api.chamabebidas.com.br';

let socket: Socket | null = null;
let connectedDriverId: number | null = null;

function joinDriverRoom(
  currentSocket: Socket,
  driverId: number,
): void {
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

  connectedDriverId = driverId;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: [
        'websocket',
        'polling',
      ],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 15000,
    });

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

export function connectDriverSocket(
  driverId: number,
): Socket {
  const currentSocket = getSocket();

  currentSocket.off('connect');

  currentSocket.on('connect', () => {
    console.log(
      '[socket] conectado:',
      currentSocket.id,
    );

    joinDriverRoom(
      currentSocket,
      driverId,
    );
  });

  if (currentSocket.connected) {
    joinDriverRoom(
      currentSocket,
      driverId,
    );
  } else {
    currentSocket.connect();
  }

  return currentSocket;
}

export function setDriverOnline(
  driverId: number,
): void {
  const currentSocket =
    connectDriverSocket(driverId);

  if (currentSocket.connected) {
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

export function disconnectDriverSocket(): void {
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
        driverId: connectedDriverId,
      },
    );
  }

  socket.removeAllListeners();
  socket.disconnect();

  socket = null;
  connectedDriverId = null;
}
