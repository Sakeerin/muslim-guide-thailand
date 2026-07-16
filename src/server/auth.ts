import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from './db/client';
import { user, session, account, verification } from './db/schema';

export const STAFF_ROLES = ['admin', 'editor', 'moderator'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Auth roles:
 *  - 'user'   → public accounts (Phase 2: reviews). DEFAULT for public sign-up.
 *  - staff    → admin | editor | moderator, assigned ONLY via
 *               scripts/create-staff.ts (never self-assignable at sign-up).
 *
 * Public sign-up is enabled for the review feature. Public users get role
 * 'user', so isStaff() still gates /admin. Core browsing needs no account
 * (PDPA data-minimization); an account is required only to post reviews.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  plugins: [
    admin({
      defaultRole: 'user', // public sign-ups are plain users, never staff
      adminRoles: ['admin'],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

export function isStaff(role: string | null | undefined): boolean {
  return Boolean(role && (STAFF_ROLES as readonly string[]).includes(role));
}
