import type { NextRequest } from 'next/server';
import { createSubmissionSchema } from '@/lib/validators/submission';
import { createSubmission } from '@/server/services/submissions';
import { apiOk, apiError, apiValidationError } from '@/lib/api';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'invalid_json', 'Body must be JSON');
  }

  const parsed = createSubmissionSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const result = await createSubmission(parsed.data);
  return apiOk({ received: true, id: result.id });
}
