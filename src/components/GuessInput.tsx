import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Send } from 'lucide-react';

interface GuessInputProps {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function GuessInput({ onGuess, disabled, placeholder = "Type your guess..." }: GuessInputProps) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guess.trim() || disabled) return;
    
    onGuess(guess.trim());
    setGuess('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      <Button
        type="submit"
        disabled={!guess.trim() || disabled}
        size="icon"
        className="shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}