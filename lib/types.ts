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
