export interface WordPair {
  word: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  bgColor: number;
  pairs: WordPair[];
}

export interface GameData {
  categories: Category[];
}
