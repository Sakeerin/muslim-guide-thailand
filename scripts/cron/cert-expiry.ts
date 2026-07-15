import 'dotenv/config';
import { runExpirySweep, listExpiringCertifications } from '../../src/server/services/certifications';

/**
 * Daily cron: expire lapsed halal certificates and downgrade the places that
 * relied on them, then report certs expiring soon for alerting.
 * Wire to email/Telegram (NOT LINE Notify — discontinued Mar 2025).
 * Run: pnpm tsx scripts/cron/cert-expiry.ts
 */
async function main() {
  const sweep = await runExpirySweep('system:cron');
  console.log(
    `[cert-expiry] expired ${sweep.expiredCerts} cert(s), downgraded ${sweep.downgradedPlaces} place(s)`,
  );

  const soon = await listExpiringCertifications(30);
  if (soon.length > 0) {
    console.log(`[cert-expiry] ${soon.length} cert(s) expiring within 30 days:`);
    for (const c of soon) {
      const name = c.placeName.th ?? c.placeName.en ?? c.placeSlug;
      console.log(`  - ${name} (${c.certNumber ?? 'no number'}) → ${c.daysLeft} days`);
    }
    // TODO(month 4): push these to the admin alert channel (email/Telegram)
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
