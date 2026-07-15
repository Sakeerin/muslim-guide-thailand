import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../src/server/db/client';
import { user, session, account, verification } from '../src/server/db/schema';

/**
 * Bootstrap/staff creation (invite-only system — public sign-up is disabled).
 * Usage: pnpm tsx scripts/create-staff.ts <email> <password> <name> [role]
 *        role: admin | editor | moderator (default: editor)
 */
async function main() {
  const [email, password, name, role = 'editor'] = process.argv.slice(2);
  if (!email || !password || !name) {
    console.error('Usage: pnpm tsx scripts/create-staff.ts <email> <password> <name> [role]');
    process.exit(1);
  }
  if (!['admin', 'editor', 'moderator'].includes(role)) {
    console.error(`Invalid role: ${role}`);
    process.exit(1);
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters');
    process.exit(1);
  }

  // Local instance with sign-up enabled — this script is the invite mechanism.
  const bootstrapAuth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: { enabled: true },
  });

  const result = await bootstrapAuth.api.signUpEmail({
    body: { email, password, name },
  });

  await db.update(user).set({ role }).where(eq(user.id, result.user.id));

  console.log(`Staff created: ${email} (role: ${role}, id: ${result.user.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
