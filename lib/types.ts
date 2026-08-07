export type CheckInDTO = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  emoji: string;
  timestamp: string;
  amountSpent: number | null;
  spendCategory: string | null;
  spendCategoryLabel: string | null;
  isWorkout: boolean;
  notes: string | null;
  googleMapsUrl: string;
};

/** Shared/read-only view — no $ amounts, category, or notes. */
export type PublicCheckInDTO = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  emoji: string;
  timestamp: string;
  isWorkout: boolean;
  googleMapsUrl: string;
};

/** The minimal shape MapView actually needs — satisfied by both DTOs above. */
export type MapCheckIn = {
  id: string;
  placeName: string;
  lat: number;
  lng: number;
  emoji: string;
  timestamp: string;
  googleMapsUrl: string;
  amountSpent?: number | null;
};

export type MovieDTO = {
  id: string;
  title: string;
  emoji: string;
  watchedAt: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
};

export type BookDTO = {
  id: string;
  title: string;
  author: string | null;
  emoji: string;
  readAt: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
};

export type JournalEntryDTO = {
  id: string;
  category: string;
  note: string;
  date: string;
  createdAt: string;
};

export type WalkDTO = {
  id: string;
  startPlaceName: string;
  startLat: number;
  startLng: number;
  endPlaceName: string;
  endLat: number;
  endLng: number;
  route: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  timestamp: string;
  notes: string | null;
  createdAt: string;
};
