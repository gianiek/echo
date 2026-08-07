export const SPEND_CATEGORIES: Record<string, string> = {
  "🛒": "Groceries",
  "🍔": "Food",
  "☕": "Coffee",
  "🛍️": "Shopping",
  "🎮": "Fun",
  "🚗": "Transport",
  "🏠": "Home",
  "💊": "Health",
  "✈️": "Travel",
  "📦": "Other",
};

export function categoryLabel(emoji: string | null): string | null {
  if (!emoji) return null;
  return SPEND_CATEGORIES[emoji] ?? "Other";
}

export const PIN_EMOJI_QUICK_PICKS = ["🛒", "🍔", "☕", "🏋️", "🎬", "🌳"];

export const MOVIE_EMOJI_QUICK_PICKS = ["🎬", "🍿", "🎥", "😂", "😱", "❤️", "💀", "🚀", "🎭"];

export const BOOK_EMOJI_QUICK_PICKS = ["📖", "📚", "🧙", "💕", "🔍", "🐉", "😢", "🚀"];
