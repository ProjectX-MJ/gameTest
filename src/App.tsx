import React, { useState } from 'react';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { WaitingRoom } from './components/WaitingRoom';
import { MultiplayerGameplay } from './components/MultiplayerGameplay';
import { GameSummary } from './components/GameSummary';

import { GameSettings } from './types/game';
import { API_BASE_URL } from './utils/network';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';

interface Room {
  id: string;
  code: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Array<{
    id: string;
    name: string;
    role: 'drawer' | 'guesser';
    connected: boolean;
    ready: boolean;
  }>;
  settings: {
    roundDuration: number;
    maxRounds: number;
    difficulty: string;
  };
  currentRound: number;
  score: number;
}

type AppState = 
  | { type: 'lobby' }
  | { type: 'waiting'; room: Room; playerId: string }
  | { type: 'multiplayer'; room: Room; playerId: string }
  | { type: 'summary'; room: Room; playerId: string; gameStats: { correctGuesses: number; totalTime: number } };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ type: 'lobby' });
  const [isLoading, setIsLoading] = useState(false);

  const apiCall = async (endpoint: string, data?: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  };

  const handleCreateRoom = async (settings: GameSettings) => {
    setIsLoading(true);
    try {
      const result = await apiCall('/rooms', { settings });
      
      if (result.success) {
        setAppState({
          type: 'waiting',
          room: result.room,
          playerId: result.room.players[0].id
        });
        toast.success(`Room created! Code: ${result.room.code}`);
      }
    } catch (error: any) {
      console.error('Failed to create room:', error);
      toast.error(error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    setIsLoading(true);
    try {
      const result = await apiCall(`/rooms/${roomCode}/join`, {});
      
      if (result.success) {
        if (result.room.status === 'waiting') {
          setAppState({
            type: 'waiting',
            room: result.room,
            playerId: result.playerId
          });
        } else {
          setAppState({
            type: 'multiplayer',
            room: result.room,
            playerId: result.playerId
          });
        }
        toast.success('Joined room successfully!');
      }
    } catch (error: any) {
      console.error('Failed to join room:', error);
      toast.error(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };



  const handleLeaveRoom = async () => {
    // If we have an active room, notify the server
    if (appState.type === 'waiting' || appState.type === 'multiplayer') {
      try {
        await apiCall(`/rooms/${appState.room.id}/leave`, { 
          playerId: appState.playerId 
        });
      } catch (error) {
        console.error('Failed to notify server of leave:', error);
      }
    }
    setAppState({ type: 'lobby' });
  };

  const handleGameEnd = (gameStats: { correctGuesses: number; totalTime: number }) => {
    setAppState(prev => {
      if (prev.type === 'multiplayer') {
        return {
          type: 'summary',
          room: prev.room,
          playerId: prev.playerId,
          gameStats
        };
      }
      return { type: 'lobby' };
    });
  };

  const handleBackToLobby = () => {
    setAppState({ type: 'lobby' });
  };

  const handleGameStart = (room: Room) => {
    console.log('Game starting with room data:', room);
    setAppState(prev => {
      if (prev.type === 'waiting') {
        return {
          type: 'multiplayer',
          room: room,
          playerId: prev.playerId
        };
      }
      return prev;
    });
  };

  const handleReturnToWaiting = (room: Room) => {
    console.log('Returning to waiting room:', room);
    setAppState(prev => {
      if (prev.type === 'multiplayer') {
        return {
          type: 'waiting',
          room: room,
          playerId: prev.playerId
        };
      }
      return prev;
    });
  };

  return (
    <>
      {appState.type === 'lobby' && (
        <MultiplayerLobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isLoading={isLoading}
        />
      )}

      {appState.type === 'waiting' && (
        <WaitingRoom
          roomId={appState.room.id}
          roomCode={appState.room.code}
          players={appState.room.players}
          playerId={appState.playerId}
          settings={appState.room.settings}
          onLeave={handleLeaveRoom}
          onGameStart={handleGameStart}
        />
      )}

      {appState.type === 'multiplayer' && (
        <MultiplayerGameplay
          roomId={appState.room.id}
          playerId={appState.playerId}
          playerRole={appState.room.players.find(p => p.id === appState.playerId)?.role || 'drawer'}
          playerName={appState.room.players.find(p => p.id === appState.playerId)?.name || 'Player'}
          players={appState.room.players}
          currentRound={appState.room.currentRound}
          maxRounds={appState.room.settings.maxRounds}
          roundDuration={appState.room.settings.roundDuration}
          onGameEnd={handleGameEnd}
          onLeaveRoom={handleLeaveRoom}
          onReturnToWaiting={handleReturnToWaiting}
        />
      )}

      {appState.type === 'summary' && (
        <GameSummary
          score={appState.room.score}
          totalTime={appState.gameStats.totalTime}
          players={appState.room.players}
          correctGuesses={appState.gameStats.correctGuesses}
          onBackToLobby={handleBackToLobby}
        />
      )}



      <Toaster />
    </>
  );
}
