import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Users, Clock, Target } from 'lucide-react';

interface GameSummaryProps {
  score: number;
  totalTime: number;
  players: Array<{
    id: string;
    name: string;
    role: 'drawer' | 'guesser';
  }>;
  correctGuesses: number;
  onBackToLobby: () => void;
}

export function GameSummary({ 
  score, 
  totalTime, 
  players, 
  correctGuesses, 
  onBackToLobby 
}: GameSummaryProps) {
  const drawer = players.find(p => p.role === 'drawer');
  const guesser = players.find(p => p.role === 'guesser');
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Game Complete!</CardTitle>
          <p className="text-muted-foreground">
            Great teamwork, {drawer?.name} and {guesser?.name}!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Final Score */}
          <div className="text-center">
            <div className="text-4xl mb-2">{score}</div>
            <p className="text-muted-foreground">Final Score</p>
          </div>
          
          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Target className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-lg">{correctGuesses}</div>
              <p className="text-sm text-muted-foreground">Correct Guesses</p>
            </div>
            
            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-lg">{formatTime(totalTime)}</div>
              <p className="text-sm text-muted-foreground">Total Time</p>
            </div>
          </div>
          
          {/* Players */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-center justify-center">
              <Users className="w-4 h-4" />
              Players
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span>{drawer?.name}</span>
                <span className="text-sm text-muted-foreground">Drawer</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span>{guesser?.name}</span>
                <span className="text-sm text-muted-foreground">Guesser</span>
              </div>
            </div>
          </div>
          
          {/* Back to Lobby Button */}
          <Button 
            onClick={onBackToLobby}
            className="w-full"
            size="lg"
          >
            Back to Lobby
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}