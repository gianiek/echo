// Real emoji — even complex ZWJ sequences with multiple people/skin-tone/gender
// modifiers — are far shorter than this. Anything longer is not a plausible emoji.
const MAX_EMOJI_LENGTH = 16;

/**
 * Rejects anything that could be interpreted as markup if ever rendered into HTML
 * (see MapView.tsx's divIcon, which builds marker content from an HTML string).
 * Validating at write time is the primary defense; escaping at render time is the
 * second layer, for data written before this existed or a future path that skips it.
 */
export function isSafeEmoji(value: string): boolean {
  if (!value || value.length > MAX_EMOJI_LENGTH) return false;
  return !/[<>&"']/.test(value);
}
