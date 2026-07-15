import { type NextRequest, NextResponse } from 'next/server';
import { createTakedownSchema } from '@/lib/validators/takedown';
import { createTakedownRequest } from '@/server/services/moderation';

/**
 * No-JS form target for the public takedown page. Accepts form-encoded data,
 * starts the 24h SLA clock, and redirects back with a status flag.
 * The JSON /api/v1/takedowns endpoint remains the contract for the app.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const referer = request.headers.get('referer') ?? '/en/legal/takedown';
  const backUrl = new URL(referer);

  const parsed = createTakedownSchema.safeParse({
    contentType: form.get('contentType'),
    contentId: form.get('contentId'),
    requesterName: form.get('requesterName') || undefined,
    requesterContact: form.get('requesterContact'),
    reason: form.get('reason'),
    legalReference: form.get('legalReference') || undefined,
    affirmTruth: form.get('affirmTruth') === 'true',
    website: form.get('website') || undefined,
  });

  if (!parsed.success) {
    backUrl.searchParams.set('status', 'error');
    return NextResponse.redirect(backUrl, { status: 303 });
  }

  if (!parsed.data.website) {
    await createTakedownRequest({
      contentType: parsed.data.contentType,
      contentId: parsed.data.contentId,
      requesterName: parsed.data.requesterName,
      requesterContact: parsed.data.requesterContact,
      reason: parsed.data.reason,
      legalReference: parsed.data.legalReference,
    });
  }

  backUrl.searchParams.set('status', 'received');
  return NextResponse.redirect(backUrl, { status: 303 });
}
