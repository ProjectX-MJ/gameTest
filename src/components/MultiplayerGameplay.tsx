import React, { useState, useEffect, useCallback } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { GameTimer } from './GameTimer';
import { GuessInput } from './GuessInput';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RotateCcw, Trophy, Eye, Pencil, Wifi, WifiOff, SkipForward } from 'lucide-react';
import { DrawingStroke, Guess } from '../types/game';
import { useRealtimeGame } from '../hooks/useRealtimeGame';
import { API_BASE_URL } from '../utils/network';
import { toast } from 'sonner@2.0.3';

interface Player {
  id: string;
  name: string;
  role: 'drawer' | 'guesser';
  connected: boolean;
}

interface MultiplayerGameplayProps {
  roomId: string;
  playerId: string;
  playerRole: 'drawer' | 'guesser';
  playerName: string;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  roundDuration: number;
  onGameEnd: (gameStats: { correctGuesses: number; totalTime: number }) => void;
  onLeaveRoom: () => void;
  onReturnToWaiting?: (room: any) => void;
}

export function MultiplayerGameplay({
  roomId,
  playerId,
  playerRole: initialRole,
  playerName,
  players: initialPlayers,
  currentRound: initialRound,
  maxRounds,
  roundDuration,
  onGameEnd,
  onLeaveRoom,
  onReturnToWaiting
}: MultiplayerGameplayProps) {
  console.log('MultiplayerGameplay props:', {
    roomId,
    playerId,
    initialRole,
    playerName,
    initialPlayers,
    initialRound,
    maxRounds,
    roundDuration
  });

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentRole, setCurrentRole] = useState<'drawer' | 'guesser'>(initialRole);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [wordHint, setWordHint] = useState<string | null>(null);
  const [wordLength, setWordLength] = useState<number>(0);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [timeRemaining, setTimeRemaining] = useState(roundDuration);
  const [isPlaying, setIsPlaying] = useState(true);
  const [gamePhase, setGamePhase] = useState<'playing' | 'summary' | 'finished'>('playing');
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(Date.now());


  // Real-time event handlers
  const handleGameStarted = useCallback((data: any) => {
    console.log('Game started event received:', data);
    if (data.room) {
      setPlayers(data.room.players);
      setCurrentRound(data.room.currentRound);
      setScore(data.room.score);
      
      // Update current player's role from the room data
      const currentPlayer = data.room.players.find((p: Player) => p.id === playerId);
      if (currentPlayer) {
        setCurrentRole(currentPlayer.role);
      }
      
      setTimeRemaining(roundDuration);
      setIsPlaying(true);
      setGamePhase('playing');
    }
  }, [playerId, roundDuration]);

  const handleWordRevealed = useCallback((data: any) => {
    console.log('Word revealed for drawer:', data);
    setCurrentWord(data.word);
    setWordHint(data.hint);
    setWordLength(data.word.length);
  }, []);

  const handleWordHint = useCallback((data: any) => {
    console.log('Word hint for guesser:', data);
    setWordLength(data.wordLength);
    setWordHint(data.hint);
    setCurrentWord(null);
  }, []);

  const handleStrokeAdded = useCallback((data: any) => {
    console.log('Stroke added:', data);
    setStrokes(prev => {
      // Prevent duplicate strokes by checking if stroke ID already exists
      const strokeExists = prev.some(s => s.id === data.stroke.id);
      if (strokeExists) {
        console.log('Stroke already exists, skipping:', data.stroke.id);
        return prev;
      }
      return [...prev, data.stroke];
    });
  }, []);

  const handleGuessResult = useCallback((data: any) => {
    console.log('Guess result:', data);
    setGuesses(prev => [...prev, data.guess]);
    setScore(data.score);
    
    if (data.correct) {
      setCorrectGuesses(prev => prev + 1);
      toast.success('Correct guess! +1 point');
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } else if (currentRole === 'drawer') {
      // Show wrong guess toast for drawer
      const guessingPlayer = players.find(p => p.role === 'guesser');
      const playerName = guessingPlayer?.name || 'Player';
      toast.error(`${playerName} guessed "${data.guess.text}", but it's wrong`);
    }
  }, [currentRole, players]);

  const handleCanvasClear = useCallback(() => {
    console.log('Canvas cleared');
    setStrokes([]);
  }, []);

  const handleRoundStarted = useCallback((data: any) => {
    console.log('Round started:', data);
    setCurrentRound(data.round);
    setPlayers(data.players);
    
    // Update current player's role
    const currentPlayer = data.players.find((p: Player) => p.id === playerId);
    if (currentPlayer) {
      setCurrentRole(currentPlayer.role);
    }
    
    setStrokes([]);
    setGuesses([]);
    setTimeRemaining(roundDuration);
    setIsPlaying(true);
    setGamePhase('playing');
    setCorrectGuesses(0);
    setGameStartTime(Date.now());
    
    toast.success(`Round ${data.round} started! You are the ${currentPlayer?.role}`);
  }, [playerId, roundDuration]);

  const handleRoundCountdown = useCallback((data: any) => {
    console.log('Round countdown (deprecated):', data);
    // This is no longer used but kept for backward compatibility
  }, []);

  const handlePlayerDisconnected = useCallback((data: any) => {
    console.log('Player disconnected during gameplay:', data);
    setPlayers(data.players);
    
    // Check if we have less than 2 connected players
    const connectedPlayers = data.players.filter((p: Player) => p.connected);
    if (connectedPlayers.length < 2) {
      toast.warning('A player disconnected - game will end soon');
      // The server should send a game:ended event shortly after this
    } else {
      toast.info('A player disconnected');
    }
  }, []);

  const handleGameEnded = useCallback((data: any) => {
    console.log('Game ended:', data);
    
    if (data.reason === 'player_disconnected') {
      // Player disconnected during game - return to waiting room
      console.log('Game ended due to player disconnection, returning to waiting room');
      toast.info(data.message || 'Game ended because a player disconnected');
      
      // Use the callback to return to waiting room if provided
      if (onReturnToWaiting && data.room) {
        setTimeout(() => {
          onReturnToWaiting(data.room);
        }, 1500);
      } else {
        // Fallback to leaving room completely
        setTimeout(() => {
          onLeaveRoom();
        }, 1500);
      }
      return;
    }
    
    // Normal game end
    setGamePhase('finished');
    setIsPlaying(false);
    toast.success(`Game finished! Final score: ${data.finalScore}`);
    
    // Calculate total game time
    const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Call onGameEnd with stats after a brief delay
    setTimeout(() => {
      onGameEnd({
        correctGuesses,
        totalTime
      });
    }, 2000);
  }, [onReturnToWaiting, onLeaveRoom, onGameEnd, correctGuesses, gameStartTime]);

  // Real-time connection
  const { connected } = useRealtimeGame({
    roomId,
    playerId,
    onGameStarted: handleGameStarted,
    onWordRevealed: handleWordRevealed,
    onWordHint: handleWordHint,
    onStrokeAdded: handleStrokeAdded,
    onGuessResult: handleGuessResult,
    onCanvasClear: handleCanvasClear,
    onRoundStarted: handleRoundStarted,
    onRoundCountdown: handleRoundCountdown,
    onGameEnded: handleGameEnded,
    onPlayerDisconnected: handlePlayerDisconnected,
  });

  // API helpers
  const apiCall = async (endpoint: string, data?: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Handle drawing
  const handleStroke = useCallback(async (stroke: DrawingStroke) => {
    if (currentRole !== 'drawer' || !isPlaying) return;

    // Add stroke locally immediately for responsiveness (only for drawer)
    setStrokes(prev => {
      // Prevent duplicates
      const strokeExists = prev.some(s => s.id === stroke.id);
      if (strokeExists) return prev;
      return [...prev, stroke];
    });

    // Send to server
    try {
      await apiCall(`/rooms/${roomId}/stroke`, {
        stroke,
        playerId
      });
    } catch (error) {
      console.error('Failed to send stroke:', error);
      // Remove the optimistically added stroke on error
      setStrokes(prev => prev.filter(s => s.id !== stroke.id));
      toast.error('Failed to sync drawing. Please try again.');
    }
  }, [roomId, playerId, currentRole, isPlaying]);

  // Handle guessing
  const handleGuess = useCallback(async (guessText: string) => {
    if (currentRole !== 'guesser' || !isPlaying) return;

    try {
      const result = await apiCall(`/rooms/${roomId}/guess`, {
        guess: guessText,
        playerId
      });
      
      // If successful, don't show any error
      console.log('Guess submitted successfully:', result);
    } catch (error) {
      console.error('Failed to send guess:', error);
      // Show a more specific error message
      toast.error('Failed to submit guess. Please try again.');
    }
  }, [roomId, playerId, currentRole, isPlaying]);

  // Handle canvas clear
  const handleClearCanvas = useCallback(async () => {
    if (currentRole !== 'drawer' || !isPlaying) return;

    try {
      await apiCall(`/rooms/${roomId}/clear`, { playerId });
      setStrokes([]);
    } catch (error) {
      console.error('Failed to clear canvas:', error);
      toast.error('Failed to clear canvas. Please try again.');
    }
  }, [roomId, playerId, currentRole, isPlaying]);

  // Handle skip word
  const handleSkipWord = useCallback(async () => {
    if (currentRole !== 'drawer' || !isPlaying) return;

    try {
      await apiCall(`/rooms/${roomId}/skip-word`, { playerId });
      toast.info('Word skipped! New word coming...');
    } catch (error) {
      console.error('Failed to skip word:', error);
      toast.error('Failed to skip word. Please try again.');
    }
  }, [roomId, playerId, currentRole, isPlaying]);

  // Handle round end (game ends after 1 round)
  const handleTimeUp = useCallback(async () => {
    setIsPlaying(false);
    setGamePhase('finished');
    
    toast.info('Time\'s up! Game finished!');
    
    try {
      // End the game immediately since we only have 1 round
      await apiCall(`/rooms/${roomId}/end-game`);
      
      // Calculate final stats and transition to summary
      const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
      
      setTimeout(() => {
        onGameEnd({
          correctGuesses,
          totalTime
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to end game:', error);
      toast.error('Failed to end game properly. Returning to lobby.');
      setTimeout(() => {
        onGameEnd({
          correctGuesses,
          totalTime: Math.floor((Date.now() - gameStartTime) / 1000)
        });
      }, 2000);
    }
  }, [roomId, correctGuesses, gameStartTime, onGameEnd]);

  // Timer countdown effect
  useEffect(() => {
    if (!isPlaying || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining, handleTimeUp]);

  // Fetch initial game state when component mounts (for games already in progress)
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        console.log('Fetching initial game state for room:', roomId);
        const result = await apiCall(`/rooms/${roomId}`);
        if (result.success && result.room) {
          const room = result.room;
          console.log('Initial room state:', room);
          
          // Update local state with server state
          setPlayers(room.players || []);
          setCurrentRound(room.currentRound || 1);
          setScore(room.score || 0);
          setStrokes(room.strokes || []);
          setGuesses(room.guesses || []);
          
          // Set current word data if available
          if (room.currentWord) {
            const currentPlayer = room.players.find((p: Player) => p.id === playerId);
            if (currentPlayer?.role === 'drawer') {
              setCurrentWord(room.currentWord.text);
              setWordHint(room.currentWord.hint);
              setWordLength(room.currentWord.text.length);
            } else {
              setWordLength(room.currentWord.text.length);
              setWordHint(room.currentWord.hint);
            }
          }
          
          // Calculate remaining time if round is active
          if (room.roundStartTime && room.status === 'playing') {
            const elapsed = Math.floor((Date.now() - room.roundStartTime) / 1000);
            const remaining = Math.max(0, roundDuration - elapsed);
            setTimeRemaining(remaining);
            setIsPlaying(remaining > 0);
            setGamePhase('playing');
          } else if (room.status === 'finished') {
            setGamePhase('finished');
            setIsPlaying(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial game state:', error);
        toast.error('Failed to sync game state. Please refresh.');
      }
    };

    if (roomId && playerId) {
      fetchInitialState();
    }
  }, [roomId, playerId, roundDuration]);

  // Check if we have valid data to render
  if (!roomId || !playerId || !playerName || players.length === 0) {
    console.log('Missing required data, showing loading...');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
            <CardTitle>Game Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-2xl font-bold text-green-600">
              Final Score: {score} words
            </div>
            <p>Thanks for playing!</p>
            <div className="flex gap-2">
              <Button onClick={onLeaveRoom} variant="outline" className="flex-1">
                New Game
              </Button>
              <Button onClick={onGameEnd} className="flex-1">
                Main Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gamePhase === 'summary') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Round {currentRound} Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xl font-bold text-blue-600">
              Score: {score} words
            </div>
            <p className="text-sm text-muted-foreground">
              Preparing next round...
            </p>
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto" />
            </div>
            <p className="text-xs text-muted-foreground">
              Roles will switch for the next round!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Badge variant={currentRole === 'drawer' ? 'default' : 'secondary'}>
              {currentRole === 'drawer' ? (
                <>
                  <Pencil className="w-3 h-3 mr-1" />
                  Drawing
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Guessing
                </>
              )}
            </Badge>
            <span className="font-medium">{playerName}</span>
            {connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Round {currentRound}/{maxRounds}</div>
            <div className="font-bold">Score: {score}</div>
          </div>

          <Button onClick={onLeaveRoom} variant="outline" size="sm">
            Leave
          </Button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {currentRole === 'drawer' ? (
            /* DRAWER VIEW */
            <div className="space-y-4">
              {/* Word Display - Compact */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Your word:</div>
                      <div className="text-xl font-bold text-blue-600">
                        {currentWord?.toUpperCase() || 'Loading...'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Hint: {wordHint}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isPlaying && (
                        <Button onClick={handleSkipWord} variant="outline" size="sm">
                          <SkipForward className="w-4 h-4 mr-1" />
                          Skip
                        </Button>
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.ceil(timeRemaining)}</div>
                        <div className="text-xs text-muted-foreground">seconds</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-3 gap-4">
                {/* Drawing Area - Larger */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Canvas</CardTitle>
                        {isPlaying && (
                          <Button onClick={handleClearCanvas} variant="outline" size="sm">
                            Clear
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <DrawingCanvas
                        isDrawer={true}
                        onStroke={handleStroke}
                        strokes={strokes}
                        disabled={!isPlaying}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Compact Guesses Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="h-fit">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-lg">Guesses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {guesses.length === 0 ? (
                          <div className="text-center text-muted-foreground text-sm py-8">
                            Waiting for guesses...
                          </div>
                        ) : (
                          guesses.slice().reverse().slice(0, 8).map((guess) => (
                            <div
                              key={guess.id}
                              className={`p-2 rounded text-sm ${
                                guess.correct
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <div className="truncate">{guess.text}</div>
                              {guess.correct && <span className="text-xs">✓ Correct!</span>}
                            </div>
                          ))
                        )}
                      </div>
                      {guesses.length > 8 && (
                        <div className="text-xs text-muted-foreground text-center mt-2">
                          +{guesses.length - 8} more guesses
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            /* GUESSER VIEW - Original Layout */
            <div className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <GameTimer
                  timeRemaining={timeRemaining}
                  totalTime={roundDuration}
                  onTimeUp={handleTimeUp}
                  isActive={isPlaying}
                />
              </div>

              {/* Word Display */}
              <Card>
                <CardContent className="text-center p-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Guess this word:</div>
                    <div className="text-2xl font-bold">
                      {wordLength > 0 ? '_ '.repeat(wordLength).trim() : 'Loading...'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {wordLength > 0 ? `${wordLength} letters` : ''} {wordHint ? `• ${wordHint}` : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Drawing Area */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Canvas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DrawingCanvas
                      isDrawer={false}
                      onStroke={handleStroke}
                      strokes={strokes}
                      disabled={!isPlaying}
                    />
                  </CardContent>
                </Card>

                {/* Guessing Area */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Guesses</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isPlaying && (
                      <GuessInput
                        onGuess={handleGuess}
                        disabled={!isPlaying || !connected}
                        placeholder={connected ? "Type your guess..." : "Connecting..."}
                      />
                    )}

                    <Separator />

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {guesses.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-4">
                          Start guessing!
                        </div>
                      ) : (
                        guesses.slice().reverse().map((guess) => (
                          <div
                            key={guess.id}
                            className={`p-2 rounded text-sm ${
                              guess.correct
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {guess.text}
                            {guess.correct && <span className="ml-2">✓</span>}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Players Info */}
          <div className="flex justify-center gap-4 mt-6">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  player.connected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={player.id === playerId ? 'font-bold' : ''}>
                  {player.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {player.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
