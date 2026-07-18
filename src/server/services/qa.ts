import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { answers, places, questions, user } from '@/server/db/schema';
import { decideReviewStatus, screenReview } from '@/lib/review-moderation';
import { writeAudit } from './audit';

export interface CreateQuestionInput {
  placeId: string;
  userId: string;
  body: string;
  lang?: string | null;
}
export interface CreateAnswerInput {
  questionId: string;
  userId: string;
  body: string;
  lang?: string | null;
}
export interface QAResult {
  id: string;
  status: 'published' | 'pending';
}

async function accountAgeMs(userId: string): Promise<number> {
  const account = await db.query.user.findFirst({ where: eq(user.id, userId) });
  return account ? Date.now() - account.createdAt.getTime() : 0;
}

/** Ask a question about a place. Same defamation-safe hybrid moderation as
 *  reviews: risk-flagged text or a brand-new account is held for a moderator. */
export async function createQuestion(input: CreateQuestionInput): Promise<QAResult> {
  const body = input.body.trim();
  const { riskFlag } = screenReview(body);
  const status = decideReviewStatus({ hasBody: true, riskFlag, accountAgeMs: await accountAgeMs(input.userId) });

  const [row] = await db
    .insert(questions)
    .values({ placeId: input.placeId, userId: input.userId, body, lang: input.lang ?? null, status, riskFlag })
    .returning({ id: questions.id });
  return { id: row!.id, status };
}

/** Answer a PUBLISHED question. Returns null if the question doesn't exist or
 *  isn't published (you can only answer questions you can see). */
export async function createAnswer(input: CreateAnswerInput): Promise<QAResult | null> {
  const q = await db.query.questions.findFirst({
    where: eq(questions.id, input.questionId),
    columns: { id: true, status: true },
  });
  if (!q || q.status !== 'published') return null;

  const body = input.body.trim();
  const { riskFlag } = screenReview(body);
  const status = decideReviewStatus({ hasBody: true, riskFlag, accountAgeMs: await accountAgeMs(input.userId) });

  const [row] = await db
    .insert(answers)
    .values({ questionId: input.questionId, userId: input.userId, body, lang: input.lang ?? null, status, riskFlag })
    .returning({ id: answers.id });
  return { id: row!.id, status };
}

export interface PublicAnswer {
  id: string;
  body: string;
  lang: string | null;
  createdAt: Date;
  authorName: string;
}
export interface PublicQuestion extends PublicAnswer {
  answers: PublicAnswer[];
}

/** Published Q&A for a place (by slug), newest question first, answers oldest
 *  first. Returns null when the slug doesn't resolve to a place. */
export async function listPublishedQABySlug(
  slug: string,
  limit = 50,
): Promise<PublicQuestion[] | null> {
  const place = await db.query.places.findFirst({
    where: eq(places.slug, slug),
    columns: { id: true },
  });
  if (!place) return null;

  const qs = await db
    .select({
      id: questions.id,
      body: questions.body,
      lang: questions.lang,
      createdAt: questions.createdAt,
      authorName: user.name,
    })
    .from(questions)
    .innerJoin(user, eq(user.id, questions.userId))
    .where(and(eq(questions.placeId, place.id), eq(questions.status, 'published')))
    .orderBy(desc(questions.createdAt))
    .limit(limit);

  if (qs.length === 0) return [];

  const rows = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      body: answers.body,
      lang: answers.lang,
      createdAt: answers.createdAt,
      authorName: user.name,
    })
    .from(answers)
    .innerJoin(user, eq(user.id, answers.userId))
    .where(and(inArray(answers.questionId, qs.map((q) => q.id)), eq(answers.status, 'published')))
    .orderBy(asc(answers.createdAt));

  const byQuestion = new Map<string, PublicAnswer[]>();
  for (const a of rows) {
    const list = byQuestion.get(a.questionId) ?? [];
    list.push({ id: a.id, body: a.body, lang: a.lang, createdAt: a.createdAt, authorName: a.authorName });
    byQuestion.set(a.questionId, list);
  }

  return qs.map((q) => ({ ...q, answers: byQuestion.get(q.id) ?? [] }));
}

// ── moderation ──────────────────────────────────────────────────────────────

/** Pending questions for the admin queue (risk-flagged first). */
export async function listPendingQuestions(limit = 100) {
  return db
    .select({
      id: questions.id,
      body: questions.body,
      lang: questions.lang,
      riskFlag: questions.riskFlag,
      createdAt: questions.createdAt,
      authorName: user.name,
      placeSlug: places.slug,
      placeName: places.name,
    })
    .from(questions)
    .innerJoin(user, eq(user.id, questions.userId))
    .innerJoin(places, eq(places.id, questions.placeId))
    .where(eq(questions.status, 'pending'))
    .orderBy(desc(questions.riskFlag), desc(questions.createdAt))
    .limit(limit);
}

/** Pending answers for the admin queue (risk-flagged first). */
export async function listPendingAnswers(limit = 100) {
  return db
    .select({
      id: answers.id,
      body: answers.body,
      lang: answers.lang,
      riskFlag: answers.riskFlag,
      createdAt: answers.createdAt,
      authorName: user.name,
      questionBody: questions.body,
      placeSlug: places.slug,
    })
    .from(answers)
    .innerJoin(user, eq(user.id, answers.userId))
    .innerJoin(questions, eq(questions.id, answers.questionId))
    .innerJoin(places, eq(places.id, questions.placeId))
    .where(eq(answers.status, 'pending'))
    .orderBy(desc(answers.riskFlag), desc(answers.createdAt))
    .limit(limit);
}

async function setQuestionStatus(
  id: string,
  status: 'published' | 'hidden' | 'removed',
  actorId: string,
  action: string,
) {
  await db.update(questions).set({ status, updatedAt: new Date() }).where(eq(questions.id, id));
  await writeAudit({ actorId, action, entityType: 'question', entityId: id });
}

export const approveQuestion = (id: string, actorId: string) =>
  setQuestionStatus(id, 'published', actorId, 'question.approve');
export const hideQuestion = (id: string, actorId: string) =>
  setQuestionStatus(id, 'hidden', actorId, 'question.hide');
export const removeQuestion = (id: string, actorId: string) =>
  setQuestionStatus(id, 'removed', actorId, 'question.remove');

async function setAnswerStatus(
  id: string,
  status: 'published' | 'hidden' | 'removed',
  actorId: string,
  action: string,
) {
  await db.update(answers).set({ status, updatedAt: new Date() }).where(eq(answers.id, id));
  await writeAudit({ actorId, action, entityType: 'answer', entityId: id });
}

export const approveAnswer = (id: string, actorId: string) =>
  setAnswerStatus(id, 'published', actorId, 'answer.approve');
export const hideAnswer = (id: string, actorId: string) =>
  setAnswerStatus(id, 'hidden', actorId, 'answer.hide');
export const removeAnswer = (id: string, actorId: string) =>
  setAnswerStatus(id, 'removed', actorId, 'answer.remove');
