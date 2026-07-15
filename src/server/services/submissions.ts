import { db } from '@/server/db/client';
import { submissions } from '@/server/db/schema';
import type { CreateSubmissionInput } from '@/lib/validators/submission';

/**
 * Public inbound reports. halal_concern is confidential: investigated
 * silently by staff; outcomes surface only as trust-status changes made
 * by the team — never as public accusations.
 */
export async function createSubmission(input: CreateSubmissionInput) {
  // honeypot filled → pretend success, store nothing
  if (input.website) return { id: null as string | null };

  const [row] = await db
    .insert(submissions)
    .values({
      category: input.category,
      placeId: input.placeId ?? null,
      payload: { details: input.details },
      reporterContact: input.reporterContact ?? null,
      isConfidential: input.category === 'halal_concern',
    })
    .returning({ id: submissions.id });

  return { id: row.id };
}
