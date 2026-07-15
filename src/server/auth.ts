import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { db } from './db/client';
import { user, session, account, verification } from './db/schema';

export const STAFF_ROLES = ['admin', 'editor', 'moderator'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * MVP auth = STAFF ONLY (invite-only). No public sign-up, no social login,
 * no merchant portal — public features never require an account (PDPA
 * data-minimization). Create staff with: pnpm tsx scripts/create-staff.ts
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
    disableSignUp: true, // invite-only
  },
  plugins: [
    admin({
      defaultRole: 'editor',
      adminRoles: ['admin'],
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

export function isStaff(role: string | null | undefined): boolean {
  return Boolean(role && (STAFF_ROLES as readonly string[]).includes(role));
}
