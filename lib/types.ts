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
