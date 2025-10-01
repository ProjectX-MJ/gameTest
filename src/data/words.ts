import { Word } from '../types/game';

export const WORD_LIBRARY: Word[] = [
  // Easy words (1-3 syllables, common objects)
  { id: 1, text: 'cat', difficulty: 1, hint: 'Small furry pet' },
  { id: 2, text: 'house', difficulty: 1, hint: 'Place where people live' },
  { id: 3, text: 'sun', difficulty: 1, hint: 'Bright star in the sky' },
  { id: 4, text: 'car', difficulty: 1, hint: 'Vehicle with four wheels' },
  { id: 5, text: 'tree', difficulty: 1, hint: 'Tall plant with leaves' },
  { id: 6, text: 'book', difficulty: 1, hint: 'You read this' },
  { id: 7, text: 'fish', difficulty: 1, hint: 'Lives in water' },
  { id: 8, text: 'bird', difficulty: 1, hint: 'Flies in the sky' },
  { id: 9, text: 'dog', difficulty: 1, hint: 'Loyal pet that barks' },
  { id: 10, text: 'flower', difficulty: 1, hint: 'Colorful plant bloom' },
  { id: 11, text: 'moon', difficulty: 1, hint: 'Bright at night' },
  { id: 12, text: 'ball', difficulty: 1, hint: 'Round toy' },
  { id: 13, text: 'cake', difficulty: 1, hint: 'Sweet birthday treat' },
  { id: 14, text: 'hat', difficulty: 1, hint: 'Wear on your head' },
  { id: 15, text: 'boat', difficulty: 1, hint: 'Floats on water' },
  { id: 16, text: 'apple', difficulty: 1, hint: 'Red or green fruit' },
  { id: 17, text: 'chair', difficulty: 1, hint: 'Sit on this' },
  { id: 18, text: 'clock', difficulty: 1, hint: 'Shows the time' },
  { id: 19, text: 'door', difficulty: 1, hint: 'Entry to a room' },
  { id: 20, text: 'shoe', difficulty: 1, hint: 'Wear on your feet' },

  // Medium words (actions, concepts)
  { id: 21, text: 'running', difficulty: 2, hint: 'Fast movement on foot' },
  { id: 22, text: 'cooking', difficulty: 2, hint: 'Making food' },
  { id: 23, text: 'swimming', difficulty: 2, hint: 'Moving through water' },
  { id: 24, text: 'reading', difficulty: 2, hint: 'Looking at words in a book' },
  { id: 25, text: 'dancing', difficulty: 2, hint: 'Moving to music' },
  { id: 26, text: 'sleeping', difficulty: 2, hint: 'Resting at night' },
  { id: 27, text: 'painting', difficulty: 2, hint: 'Creating art with brushes' },
  { id: 28, text: 'climbing', difficulty: 2, hint: 'Going up something tall' },
  { id: 29, text: 'doctor', difficulty: 2, hint: 'Medical professional' },
  { id: 30, text: 'teacher', difficulty: 2, hint: 'Works at a school' },
  { id: 31, text: 'birthday', difficulty: 2, hint: 'Annual celebration' },
  { id: 32, text: 'vacation', difficulty: 2, hint: 'Time off for fun' },
  { id: 33, text: 'rainbow', difficulty: 2, hint: 'Colorful arc in sky' },
  { id: 34, text: 'volcano', difficulty: 2, hint: 'Mountain that erupts' },
  { id: 35, text: 'sandwich', difficulty: 2, hint: 'Food between bread' },
  { id: 36, text: 'bicycle', difficulty: 2, hint: 'Two-wheeled vehicle' },
  { id: 37, text: 'computer', difficulty: 2, hint: 'Electronic device' },
  { id: 38, text: 'elephant', difficulty: 2, hint: 'Large gray animal' },
  { id: 39, text: 'hospital', difficulty: 2, hint: 'Where sick people go' },
  { id: 40, text: 'telephone', difficulty: 2, hint: 'Device for calling' },

  // Hard words (abstract concepts, complex objects)
  { id: 41, text: 'democracy', difficulty: 3, hint: 'Government by the people' },
  { id: 42, text: 'invisible', difficulty: 3, hint: 'Cannot be seen' },
  { id: 43, text: 'nightmare', difficulty: 3, hint: 'Scary dream' },
  { id: 44, text: 'jealousy', difficulty: 3, hint: 'Envious feeling' },
  { id: 45, text: 'friendship', difficulty: 3, hint: 'Close relationship' },
  { id: 46, text: 'confusion', difficulty: 3, hint: 'State of being puzzled' },
  { id: 47, text: 'gravity', difficulty: 3, hint: 'Force pulling down' },
  { id: 48, text: 'photosynthesis', difficulty: 3, hint: 'How plants make energy' },
  { id: 49, text: 'microscope', difficulty: 3, hint: 'Makes tiny things big' },
  { id: 50, text: 'archaeology', difficulty: 3, hint: 'Study of ancient things' },
  { id: 51, text: 'procrastination', difficulty: 3, hint: 'Delaying tasks' },
  { id: 52, text: 'metamorphosis', difficulty: 3, hint: 'Complete transformation' },
  { id: 53, text: 'ecosystem', difficulty: 3, hint: 'Environmental community' },
  { id: 54, text: 'architecture', difficulty: 3, hint: 'Art of building design' },
  { id: 55, text: 'philosophy', difficulty: 3, hint: 'Study of wisdom' },
  { id: 56, text: 'mythology', difficulty: 3, hint: 'Ancient stories and legends' },
  { id: 57, text: 'psychology', difficulty: 3, hint: 'Study of the mind' },
  { id: 58, text: 'evolution', difficulty: 3, hint: 'Change over time' },
  { id: 59, text: 'melancholy', difficulty: 3, hint: 'Thoughtful sadness' },
  { id: 60, text: 'serendipity', difficulty: 3, hint: 'Happy accident' },
];

export function getRandomWord(difficulty?: 1 | 2 | 3 | 'mixed'): Word {
  let filteredWords = WORD_LIBRARY;
  
  if (difficulty && difficulty !== 'mixed') {
    filteredWords = WORD_LIBRARY.filter(word => word.difficulty === difficulty);
  }
  
  const randomIndex = Math.floor(Math.random() * filteredWords.length);
  return filteredWords[randomIndex];
}

export function checkGuess(guess: string, targetWord: string): boolean {
  return guess.toLowerCase().trim() === targetWord.toLowerCase().trim();
}