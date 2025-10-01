export interface WordEntry {
  text: string;
  difficulty: 1 | 2 | 3;
  hint: string;
}

export const WORDS: WordEntry[] = [
  { text: 'cat', difficulty: 1, hint: 'Small furry pet' },
  { text: 'house', difficulty: 1, hint: 'Place where people live' },
  { text: 'sun', difficulty: 1, hint: 'Bright star in the sky' },
  { text: 'car', difficulty: 1, hint: 'Vehicle with four wheels' },
  { text: 'tree', difficulty: 1, hint: 'Tall plant with leaves' },
  { text: 'book', difficulty: 1, hint: 'You read this' },
  { text: 'fish', difficulty: 1, hint: 'Lives in water' },
  { text: 'bird', difficulty: 1, hint: 'Flies in the sky' },
  { text: 'dog', difficulty: 1, hint: 'Loyal pet that barks' },
  { text: 'flower', difficulty: 1, hint: 'Colorful plant bloom' },
  { text: 'running', difficulty: 2, hint: 'Fast movement on foot' },
  { text: 'cooking', difficulty: 2, hint: 'Making food' },
  { text: 'swimming', difficulty: 2, hint: 'Moving through water' },
  { text: 'doctor', difficulty: 2, hint: 'Medical professional' },
  { text: 'rainbow', difficulty: 2, hint: 'Colorful arc in sky' },
  { text: 'volcano', difficulty: 2, hint: 'Mountain that erupts' },
  { text: 'bicycle', difficulty: 2, hint: 'Two-wheeled vehicle' },
  { text: 'elephant', difficulty: 2, hint: 'Large gray animal' },
  { text: 'hospital', difficulty: 2, hint: 'Where sick people go' },
  { text: 'computer', difficulty: 2, hint: 'Electronic device' },
  { text: 'invisible', difficulty: 3, hint: 'Cannot be seen' },
  { text: 'friendship', difficulty: 3, hint: 'Close relationship' },
  { text: 'gravity', difficulty: 3, hint: 'Force pulling down' },
  { text: 'microscope', difficulty: 3, hint: 'Makes tiny things big' },
  { text: 'ecosystem', difficulty: 3, hint: 'Environmental community' },
  { text: 'philosophy', difficulty: 3, hint: 'Study of wisdom' },
  { text: 'psychology', difficulty: 3, hint: 'Study of the mind' },
  { text: 'evolution', difficulty: 3, hint: 'Change over time' },
  { text: 'melancholy', difficulty: 3, hint: 'Thoughtful sadness' },
  { text: 'serendipity', difficulty: 3, hint: 'Happy accident' }
];
