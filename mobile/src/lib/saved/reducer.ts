/**
 * Saved-places state is a list of {slug, name}. Storing the name lets the Saved
 * screen render offline without a network round-trip. Pure reducer — the RN
 * store (store.ts) wires this to AsyncStorage. Mirrors the web localStorage
 * saved-places behaviour (keyed by slug, no login required).
 */
export interface SavedPlace {
  slug: string;
  name: string;
}

export type SavedState = readonly SavedPlace[];

export function isSaved(state: SavedState, slug: string): boolean {
  return state.some((p) => p.slug === slug);
}

export function addSaved(state: SavedState, place: SavedPlace): SavedState {
  return isSaved(state, place.slug) ? state : [...state, place];
}

export function removeSaved(state: SavedState, slug: string): SavedState {
  return state.filter((p) => p.slug !== slug);
}

export function toggleSaved(state: SavedState, place: SavedPlace): SavedState {
  return isSaved(state, place.slug) ? removeSaved(state, place.slug) : addSaved(state, place);
}
