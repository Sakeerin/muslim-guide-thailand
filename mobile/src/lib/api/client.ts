import type { ApiEnvelope } from '@/types/api';
import { API_BASE_URL } from '@/lib/config';
import { unwrapEnvelope } from './envelope';

export type QueryValue = string | number | boolean | undefined | null;
export type Query = Record<string, QueryValue>;

/** Bearer token provider — wired to SecureStore in the RN entry, injected here
 *  so this module stays pure/testable and free of expo-* imports. */
type TokenProvider = () => Promise<string | null> | string | null;
let getToken: TokenProvider = () => null;
export function setTokenProvider(fn: TokenProvider) {
  getToken = fn;
}

/**
 * Build a URL + query string WITHOUT the URL global (incomplete under Hermes),
 * so it works identically in React Native and Node tests. Empty/undefined/null
 * params are dropped.
 */
export function buildUrl(path: string, query?: Query): string {
  const base = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (!query) return base;
  const qs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  if (!qs) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`;
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** attach Authorization: Bearer <token> if a token is available */
  auth?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  let json: ApiEnvelope<T> | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    json = null;
  }
  return unwrapEnvelope<T>(res.status, res.ok, json);
}
