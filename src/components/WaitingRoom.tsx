import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Users, Clock, Target, Wifi, WifiOff, Check, X, Play } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { API_BASE_URL } from '../utils/network';

interface Player {
  id: string;
  name: string;
  role: 'drawer' | 'guesser';
  connected: boolean;
  ready: boolean;
}

interface WaitingRoomProps {
  roomId: string;
  roomCode: string;
  players: Player[];
  playerId: string;
  settings: {
    roundDuration: number;
    maxRounds: number;
    difficulty: string;
  };
  onLeave: () => void;
  onGameStart: (room: any) => void;
}

export function WaitingRoom({ roomId, roomCode, players: initialPlayers, playerId, settings, onLeave, onGameStart }: WaitingRoomProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  
  // Update players state when props change
  useEffect(() => {
    console.log('Updating players from props:', initialPlayers);
    setPlayers(initialPlayers);
  }, [initialPlayers]);
  
  const { connected } = useRealtimeGame({
    roomId,
    playerId,
    onGameStarted: (payload) => {
      console.log('✅ Game started event received in waiting room:', payload);
      toast.success('Game starting!');
      if (payload?.room) {
        onGameStart(payload.room);
      }
    },
    onPlayerJoined: (payload) => {
      console.log('✅ Player joined event received:', payload);
      if (payload?.players) {
        setPlayers(payload.players);
      }
      if (payload?.playerName) {
        toast.success(`${payload.playerName} joined the room!`);
      }
    },
    onPlayerDisconnected: (payload) => {
      console.log('✅ Player disconnected event:', payload);
      if (payload?.players) {
        setPlayers(payload.players);
      }
      toast.info('A player disconnected');
    },
    onPlayerReady: (payload) => {
      console.log('✅ Player ready event received:', payload);
      if (payload?.players) {
        setPlayers(payload.players);
      }
      const readyPlayer = payload?.players?.find((p: Player) => p.id === payload.playerId);
      if (readyPlayer) {
        toast.info(`${readyPlayer.name} is ${payload.ready ? 'ready' : 'not ready'}`);
      }
    },
    onTestMessage: (payload) => {
      console.log('✅ Test message received:', payload);
      toast.info('Realtime connection working!');
    },
    onGameEnded: (payload) => {
      if (payload?.reason === 'player_disconnected' && payload?.room) {
        setPlayers(payload.room.players ?? []);
      }
    }
  });

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied to clipboard!');
  };

  const toggleReady = async () => {
    const currentPlayer = players.find(p => p.id === playerId);
    if (!currentPlayer) return;

    const newReadyState = !currentPlayer.ready;
    
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          ready: newReadyState
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ready status');
      }

      // Don't update local state here - wait for broadcast event
    } catch (error) {
      console.error('Failed to toggle ready:', error);
      toast.error('Failed to update ready status');
    }
  };

  const startGame = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start game');
      }

      toast.success('Starting game!');
    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast.error(error.message || 'Failed to start game');
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case '1': return 'Easy';
      case '2': return 'Medium';
      case '3': return 'Hard';
      case 'mixed': return 'Mixed';
      default: return difficulty;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            Waiting Room
            {connected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </CardTitle>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-mono font-bold text-blue-600">{roomCode}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomCode}
              className="p-1"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Players */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="font-medium">Players ({players.filter(p => p.connected).length}/2)</span>
            </div>
            
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      player.connected ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium">{player.name}</span>
                    {player.ready ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={player.role === 'drawer' ? 'default' : 'secondary'}>
                      {player.role === 'drawer' ? '🎨 Drawer' : '👁️ Guesser'}
                    </Badge>
                    {player.ready && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Ready
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {players.length < 2 && (
                <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center text-muted-foreground">
                  Waiting for another player...
                </div>
              )}
            </div>
          </div>

          {/* Game Settings */}
          <div className="space-y-3">
            <h3 className="font-medium">Game Settings</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">Round Time</div>
                  <div className="text-muted-foreground">{settings.roundDuration}s</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium">Rounds</div>
                  <div className="text-muted-foreground">{settings.maxRounds}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full" />
                <div>
                  <div className="font-medium">Difficulty</div>
                  <div className="text-muted-foreground">{getDifficultyLabel(settings.difficulty)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ready Status */}
          {players.filter(p => p.connected).length === 2 && (
            <>
              {!players.every(p => p.ready) ? (
                <div className="bg-yellow-50 p-3 rounded-lg text-sm border border-yellow-200">
                  <div className="font-medium text-yellow-800 mb-1">⏳ Waiting for all players to be ready</div>
                  <div className="text-yellow-700">
                    Both players need to click "Ready!" before you can start the game.
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 p-3 rounded-lg text-sm border border-green-200">
                  <div className="font-medium text-green-800 mb-1">✅ All players ready!</div>
                  <div className="text-green-700">
                    Either player can click "Start Game" to begin.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <div className="font-medium mb-1">How to play:</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• The drawer sees the word and draws it</li>
              <li>• The guesser types guesses to win points</li>
              <li>• Roles switch each round</li>
              <li>• Try to guess as many words as possible!</li>
            </ul>
          </div>

          <div className="space-y-2">
            {/* Ready/Start Game buttons */}
            {players.filter(p => p.connected).length === 2 ? (
              <div className="flex gap-2">
                <Button 
                  onClick={toggleReady}
                  variant={players.find(p => p.id === playerId)?.ready ? "secondary" : "default"}
                  className="flex-1"
                >
                  {players.find(p => p.id === playerId)?.ready ? "Not Ready" : "Ready!"}
                </Button>
                
                {players.every(p => p.ready) && (
                  <Button 
                    onClick={startGame}
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Game
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-2">
                Waiting for player...
              </div>
            )}
            
            {/* Leave Room button */}
            <Button onClick={onLeave} variant="outline" className="w-full">
              Leave Room
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground">
            Share the room code with a friend to start playing!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
