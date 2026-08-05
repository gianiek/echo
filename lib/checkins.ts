import type { CheckIn } from "@/app/generated/prisma/client";
import { googleMapsUrl } from "@/lib/maps";
import { categoryLabel } from "@/lib/categories";

export function serializeCheckIn(checkIn: CheckIn) {
  return {
    id: checkIn.id,
    placeName: checkIn.placeName,
    lat: checkIn.lat,
    lng: checkIn.lng,
    emoji: checkIn.emoji,
    timestamp: checkIn.timestamp.toISOString(),
    amountSpent: checkIn.amountSpent,
    spendCategory: checkIn.spendCategory,
    spendCategoryLabel: categoryLabel(checkIn.spendCategory),
    isWorkout: checkIn.isWorkout,
    notes: checkIn.notes,
    googleMapsUrl: googleMapsUrl(checkIn.lat, checkIn.lng),
  };
}
