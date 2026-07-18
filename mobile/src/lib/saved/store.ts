import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isSaved, toggleSaved, type SavedPlace, type SavedState } from './reducer';

const STORAGE_KEY = 'muslimguide.saved';

interface SavedStore {
  places: SavedState;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (place: SavedPlace) => void;
  has: (slug: string) => boolean;
}

/** Saved places persisted in AsyncStorage (no login — same model as the web). */
export const useSavedStore = create<SavedStore>((set, get) => ({
  places: [],
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as SavedPlace[]) : [];
      set({ places: Array.isArray(parsed) ? parsed : [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  toggle: (place) => {
    const next = toggleSaved(get().places, place);
    set({ places: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },
  has: (slug) => isSaved(get().places, slug),
}));
