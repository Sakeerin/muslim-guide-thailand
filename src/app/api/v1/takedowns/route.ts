import type { NextRequest } from 'next/server';
import { createTakedownSchema } from '@/lib/validators/takedown';
import { createTakedownRequest } from '@/server/services/moderation';
import { apiOk, apiError, apiValidationError } from '@/lib/api';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }

  const parsed = createTakedownSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  // honeypot → silently accept, store nothing
  if (parsed.data.website) return apiOk({ received: true });

  const row = await createTakedownRequest({
    contentType: parsed.data.contentType,
    contentId: parsed.data.contentId,
    requesterName: parsed.data.requesterName,
    requesterContact: parsed.data.requesterContact,
    reason: parsed.data.reason,
    legalReference: parsed.data.legalReference,
  });

  // 24h SLA clock starts now (deadline computed server-side)
  return apiOk({ received: true, id: row.id });
}
