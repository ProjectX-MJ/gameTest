import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, Room } from 'colyseus.js';
import { COLYSEUS_ENDPOINT } from '../utils/network';

interface UseRealtimeGameOptions {
  roomId: string;
  playerId: string;
  onGameStarted?: (data: any) => void;
  onWordRevealed?: (data: any) => void;
  onWordHint?: (data: any) => void;
  onStrokeAdded?: (data: any) => void;
  onGuessResult?: (data: any) => void;
  onCanvasClear?: () => void;
  onRoundStarted?: (data: any) => void;
  onRoundCountdown?: (data: any) => void;
  onGameEnded?: (data: any) => void;
  onPlayerDisconnected?: (data: any) => void;
  onPlayerJoined?: (data: any) => void;
  onPlayerReady?: (data: any) => void;
  onTestMessage?: (data: any) => void;
}

type EventKey = keyof Pick<UseRealtimeGameOptions,
  | 'onGameStarted'
  | 'onWordRevealed'
  | 'onWordHint'
  | 'onStrokeAdded'
  | 'onGuessResult'
  | 'onCanvasClear'
  | 'onRoundStarted'
  | 'onRoundCountdown'
  | 'onGameEnded'
  | 'onPlayerDisconnected'
  | 'onPlayerJoined'
  | 'onPlayerReady'
  | 'onTestMessage'
>;

const EVENT_MAP: Array<{ event: string; handler: EventKey }> = [
  { event: 'game:started', handler: 'onGameStarted' },
  { event: 'word:revealed', handler: 'onWordRevealed' },
  { event: 'word:hint', handler: 'onWordHint' },
  { event: 'stroke:added', handler: 'onStrokeAdded' },
  { event: 'guess:result', handler: 'onGuessResult' },
  { event: 'canvas:clear', handler: 'onCanvasClear' },
  { event: 'round:started', handler: 'onRoundStarted' },
  { event: 'round:countdown', handler: 'onRoundCountdown' },
  { event: 'game:ended', handler: 'onGameEnded' },
  { event: 'player:disconnected', handler: 'onPlayerDisconnected' },
  { event: 'player:joined', handler: 'onPlayerJoined' },
  { event: 'player:ready', handler: 'onPlayerReady' },
  { event: 'test:message', handler: 'onTestMessage' },
];

export function useRealtimeGame(options: UseRealtimeGameOptions) {
  const {
    roomId,
    playerId,
  } = options;

  const [connected, setConnected] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const clientRef = useRef<Client | null>(null);
  const handlersRef = useRef<UseRealtimeGameOptions>(options);

  handlersRef.current = options;

  useEffect(() => {
    if (!roomId || !playerId) {
      setConnected(false);
      return;
    }

    let disposed = false;

    const client = new Client(COLYSEUS_ENDPOINT);
    clientRef.current = client;

    async function connect() {
      try {
        const room = await client.joinById(roomId, { playerId });
        if (disposed) {
          await room.leave(true);
          return;
        }

        roomRef.current = room;
        setConnected(true);

        EVENT_MAP.forEach(({ event, handler }) => {
          room.onMessage(event, (payload: any) => {
            const handlerFn = handlersRef.current[handler] as ((data: any) => void) | undefined;
            if (handlerFn) {
              handlerFn(payload);
            }
          });
        });

        room.onLeave(() => {
          if (disposed) return;
          setConnected(false);
        });
      } catch (error) {
        console.error('Failed to join Colyseus room:', error);
        if (!disposed) {
          setConnected(false);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      setConnected(false);

      const room = roomRef.current;
      if (room) {
        try {
          room.removeAllListeners();
          room.leave(true);
        } catch (error) {
          console.error('Error disconnecting from room:', error);
        }
      }
      roomRef.current = null;
      clientRef.current = null;
    };
  }, [roomId, playerId]);

  const sendMessage = useCallback((event: string, data: any) => {
    const room = roomRef.current;
    if (!room) {
      console.warn('Room not connected');
      return;
    }

    try {
      room.send(event, data);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  return {
    connected,
    sendMessage,
  };
}
