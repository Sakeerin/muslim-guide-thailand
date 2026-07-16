/**
 * Review moderation — defamation-safe hybrid model for Thailand.
 *
 * Thai criminal defamation (Penal Code s.326/328) + Computer Crime Act make
 * public factual accusations legally risky for both the author and the
 * platform. So reviews are experience-only, and any text that reads like a
 * factual accusation — especially "this place isn't really halal", fraud, or
 * contamination claims — is HELD for a human moderator instead of being
 * auto-published. Halal-status concerns belong in the confidential report
 * channel, not public reviews.
 *
 * ⚠️ NEEDS-LEGAL-REVIEW: the RISK_TERMS list below must be reviewed and
 * signed off by legal counsel (Thai + Malay + Arabic + Indonesian) before the
 * review feature is enabled in production. See docs/launch-checklist.md.
 */

// High-risk terms (normalized, lowercased). Matching one holds the review for
// pre-moderation — it does NOT auto-reject. Grouped by intent for auditability.
const RISK_TERMS: string[] = [
  // — halal-status accusations (route to the confidential report channel) —
  'ไม่ฮาลาล', 'ไม่ฮาล้าล', 'ไม่ได้ฮาลาล', 'อ้างฮาลาล', 'ฮาลาลปลอม', 'ตราปลอม',
  'not halal', 'fake halal', 'not really halal', 'haram',
  'bukan halal', 'tak halal', 'tidak halal',
  'ليس حلال', 'غير حلال', 'حرام',
  // — pork / alcohol contamination claims —
  'หมู', 'น้ำมันหมู', 'เหล้า', 'แอลกอฮอล์', 'สุรา',
  'pork', 'lard', 'alcohol', 'liquor', 'wine', 'beer',
  'babi', 'arak', 'khamr', 'خنزير', 'كحول', 'خمر',
  // — fraud / deception / crime accusations —
  'หลอก', 'โกง', 'ปลอม', 'ต้มตุ๋น', 'ขโมย', 'โจร',
  'scam', 'fraud', 'cheat', 'lied', 'lie', 'steal', 'thief', 'fake',
  'menipu', 'penipu', 'tipu', 'palsu',
  'احتيال', 'نصب', 'كذب', 'سرقة',
  // — health / contamination / illness attribution —
  'สกปรก', 'อาหารเป็นพิษ', 'ป่วย', 'ท้องเสีย', 'แมลงสาบ', 'หนู',
  'food poisoning', 'poisoned', 'cockroach', 'rat', 'filthy', 'unhygienic',
  'keracunan', 'kotor', 'lipas', 'تسمم', 'قذر', 'صرصور',
];

export interface ScreenResult {
  riskFlag: boolean;
  matchedTerms: string[];
}

// Homoglyph fold: common Cyrillic/Greek look-alikes → Latin (evasion defence).
const HOMOGLYPHS: Record<string, string> = {
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', к: 'k', ѕ: 's',
  α: 'a', ο: 'o', ρ: 'p', ν: 'v', 'ｅ': 'e',
};
// built from the map's keys so every glyph is covered (ranges miss outliers)
const HOMOGLYPH_RE = new RegExp(`[${Object.keys(HOMOGLYPHS).join('')}]`, 'g');

/**
 * Aggressive normalization so trivial evasions can't slip an accusation past
 * the filter: NFKC (folds full-width/compatibility forms), strip zero-width
 * chars, fold homoglyphs, then collapse ALL whitespace/punctuation so
 * "ไม่ ฮาลาล", "n0t　halal", "р​ork" all reduce to a matchable run.
 */
function normalize(text: string): string {
  let s = text.normalize('NFKC').toLowerCase();
  s = s.replace(/[​-‍﻿]/g, ''); // zero-width
  s = s.replace(HOMOGLYPH_RE, (c) => HOMOGLYPHS[c] ?? c);
  // drop everything except letters/marks/digits across scripts (removes spaces,
  // punctuation, separators) so terms match regardless of interstitial noise
  s = s.replace(/[^\p{L}\p{M}\p{N}]+/gu, '');
  return s;
}

/** Flag a review body if it contains any high-risk accusation term. */
export function screenReview(body: string | null | undefined): ScreenResult {
  if (!body || !body.trim()) return { riskFlag: false, matchedTerms: [] };
  const norm = normalize(body);
  // terms are compared in the same normalized space (spaces removed etc.)
  const matched = RISK_TERMS.filter((term) => norm.includes(normalize(term)));
  return { riskFlag: matched.length > 0, matchedTerms: matched };
}

export const NEW_ACCOUNT_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface ReviewDecisionInput {
  hasBody: boolean;
  riskFlag: boolean;
  /** ms since the reviewer's account was created */
  accountAgeMs: number;
}

/**
 * Hybrid moderation decision:
 *  - brand-new account (<48h) → pending (spam/rating-manipulation gate; applies
 *    to star-only reviews too — a fresh account can't move a rating instantly)
 *  - risk-flagged text        → pending (human review; defamation-safe)
 *  - star-only from an established account → published (nothing to moderate)
 *  - clean text from an established account → published (post-moderation)
 */
export function decideReviewStatus(input: ReviewDecisionInput): 'published' | 'pending' {
  if (input.accountAgeMs < NEW_ACCOUNT_WINDOW_MS) return 'pending';
  if (input.riskFlag) return 'pending';
  return 'published';
}
