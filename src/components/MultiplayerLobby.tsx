import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Users, Plus } from 'lucide-react';
import { GameSettings } from '../types/game';

interface MultiplayerLobbyProps {
  onCreateRoom: (settings: GameSettings) => void;
  onJoinRoom: (roomCode: string) => void;
  isLoading?: boolean;
}

export function MultiplayerLobby({ onCreateRoom, onJoinRoom, isLoading }: MultiplayerLobbyProps) {
  const [roomCode, setRoomCode] = useState('');
  const [settings, setSettings] = useState<GameSettings>({
    roundDuration: 90,
    maxRounds: 1,
    wordsPerRound: 5,
    difficulty: 'mixed'
  });

  const handleCreateRoom = () => {
    onCreateRoom(settings);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase());
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">🎨 Quick Draw</CardTitle>
          <p className="text-muted-foreground">
            Draw and guess your way to victory!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Multiplayer Options */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Multiplayer
            </h3>
            
            <div className="space-y-3">
              <Button 
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="w-full"
                variant="default"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="roomCode">Enter Room Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                    maxLength={6}
                    className="text-center font-mono text-lg tracking-wider"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim() || isLoading}
                    size="lg"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Game Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Game Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="roundDuration">Round Duration</Label>
              <Select 
                value={settings.roundDuration.toString()} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, roundDuration: parseInt(value) }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="90">1.5 minutes</SelectItem>
                  <SelectItem value="120">2 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                value={settings.difficulty} 
                onValueChange={(value: any) => setSettings(prev => ({ ...prev, difficulty: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Easy</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>


          </div>

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Connecting...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}