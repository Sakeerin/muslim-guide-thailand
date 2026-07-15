'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'mgt:saved-places';

export interface SavedEntry {
  slug: string;
  name: string;
  savedAt: string;
}

function read(): SavedEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as SavedEntry[];
  } catch {
    return [];
  }
}

// Cache the parsed array so useSyncExternalStore gets a stable reference
// between renders (it compares snapshots by identity).
let cache: SavedEntry[] = [];
let cacheRaw: string | null = null;

function getSnapshot(): SavedEntry[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}

const EMPTY: SavedEntry[] = [];
function getServerSnapshot(): SavedEntry[] {
  return EMPTY;
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener); // sync across tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function write(entries: SavedEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  emit();
}

export function useSavedPlaces(): SavedEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function isSaved(slug: string): boolean {
  return getSnapshot().some((e) => e.slug === slug);
}

export function toggleSavedPlace(entry: Omit<SavedEntry, 'savedAt'>): boolean {
  const entries = read();
  const exists = entries.some((e) => e.slug === entry.slug);
  const next = exists
    ? entries.filter((e) => e.slug !== entry.slug)
    : [...entries, { ...entry, savedAt: new Date().toISOString() }];
  write(next);
  return !exists;
}
