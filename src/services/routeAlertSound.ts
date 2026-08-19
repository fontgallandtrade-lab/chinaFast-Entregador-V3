import {
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

const ROUTE_ALERT_SOUND =
  require('../../assets/sounds/nova-rota.mp3');

let player:
  ReturnType<typeof createAudioPlayer> | null = null;

let initialized = false;

async function initialize(): Promise<void> {
  if (initialized) {
    return;
  }

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  });

  initialized = true;
}

async function start(): Promise<void> {
  try {
    await initialize();

    if (!player) {
      player = createAudioPlayer(
        ROUTE_ALERT_SOUND,
      );

      player.loop = true;
      player.volume = 1;
    }

    if (player.playing) {
      return;
    }

    await player.seekTo(0);
    player.play();

    console.log(
      '[route-alert] Alerta de nova rota iniciado.',
    );
  } catch (error) {
    console.log(
      '[route-alert] Erro ao iniciar:',
      error instanceof Error
        ? error.message
        : error,
    );
  }
}

async function stop(): Promise<void> {
  try {
    if (!player) {
      return;
    }

    player.pause();

    await player.seekTo(0);

    console.log(
      '[route-alert] Alerta de nova rota parado.',
    );
  } catch (error) {
    console.log(
      '[route-alert] Erro ao parar:',
      error instanceof Error
        ? error.message
        : error,
    );
  }
}

function destroy(): void {
  if (!player) {
    return;
  }

  try {
    player.pause();
    player.remove();
  } finally {
    player = null;
  }
}

export const routeAlertSound = {
  start,
  stop,
  destroy,
};
