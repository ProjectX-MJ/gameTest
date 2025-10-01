import React, { useEffect, useState } from 'react';
import { Progress } from './ui/progress';

interface GameTimerProps {
  timeRemaining: number;
  totalTime: number;
  onTimeUp: () => void;
  isActive: boolean;
}

export function GameTimer({ timeRemaining, totalTime, onTimeUp, isActive }: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isActive || displayTime <= 0) return;

    const interval = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, displayTime, onTimeUp]);

  const progressValue = ((totalTime - displayTime) / totalTime) * 100;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  const getTimerColor = () => {
    if (displayTime <= 10) return 'text-red-500';
    if (displayTime <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-2xl font-bold ${getTimerColor()}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <Progress 
        value={progressValue} 
        className="w-64 h-2"
      />
      {displayTime <= 10 && displayTime > 0 && (
        <div className="text-red-500 animate-pulse">
          Time's almost up!
        </div>
      )}
    </div>
  );
}