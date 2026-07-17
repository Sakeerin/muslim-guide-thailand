import { and, asc, count, eq, sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { importRecords, places } from '@/server/db/schema';
import type { I18nText } from '@/server/db/schema/types';
import { normalizePlaceName } from '@/lib/import-match';
import { writeAudit } from './audit';

type PlaceType = 'restaurant' | 'mosque' | 'prayer_room' | 'hotel' | 'attraction' | 'shop' | 'other';

export interface IngestRecord {
  source: string;
  sourceRef: string;
  placeType: PlaceType;
  name: I18nText;
  address?: I18nText;
  lat: number;
  lng: number;
  raw?: unknown;
  attribution?: string;
}

const geog = (lng: number, lat: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

/** Bulk upsert into staging (idempotent on source+source_ref). Returns count inserted/updated. */
export async function ingestRecords(records: IngestRecord[]): Promise<number> {
  let n = 0;
  for (const r of records) {
    await db
      .insert(importRecords)
      .values({
        source: r.source,
        sourceRef: r.sourceRef,
        placeType: r.placeType,
        name: r.name,
        address: r.address ?? {},
        geog: geog(r.lng, r.lat) as unknown as string,
        raw: (r.raw ?? {}) as object,
        attribution: r.attribution ?? null,
      })
      .onConflictDoUpdate({
        target: [importRecords.source, importRecords.sourceRef],
        // only refresh still-pending rows; never clobber a reviewed decision
        set: { name: r.name, address: r.address ?? {}, raw: (r.raw ?? {}) as object },
        setWhere: eq(importRecords.status, 'pending'),
      });
    n++;
  }
  return n;
}

/** Pending counts per source, for the import dashboard. */
export async function pendingCountsBySource() {
  return db
    .select({ source: importRecords.source, count: count() })
    .from(importRecords)
    .where(eq(importRecords.status, 'pending'))
    .groupBy(importRecords.source);
}

export interface PendingImport {
  id: string;
  source: string;
  sourceRef: string;
  placeType: string;
  name: I18nText;
  address: I18nText;
  attribution: string | null;
  lat: number;
  lng: number;
}

export async function listPendingImports(source?: string, limit = 50): Promise<PendingImport[]> {
  const conds = [eq(importRecords.status, 'pending')];
  if (source) conds.push(eq(importRecords.source, source));
  const rows = await db
    .select({
      id: importRecords.id,
      source: importRecords.source,
      sourceRef: importRecords.sourceRef,
      placeType: importRecords.placeType,
      name: importRecords.name,
      address: importRecords.address,
      attribution: importRecords.attribution,
      lat: sql<number>`ST_Y(${importRecords.geog}::geometry)`,
      lng: sql<number>`ST_X(${importRecords.geog}::geometry)`,
    })
    .from(importRecords)
    .where(and(...conds))
    .orderBy(asc(importRecords.createdAt))
    .limit(limit);
  return rows as PendingImport[];
}

export interface CandidateMatch {
  placeId: string;
  slug: string;
  name: I18nText;
  status: string;
  distanceM: number;
  nameSimilarity: number;
  likelyDuplicate: boolean;
}

/**
 * Candidate existing places for an import record — nearby (PostGIS) and/or
 * name-similar (pg_trgm on normalized names). Ordered by distance.
 */
export async function findMatchCandidates(recordId: string): Promise<CandidateMatch[]> {
  const rec = await db.query.importRecords.findFirst({ where: eq(importRecords.id, recordId) });
  if (!rec) return [];
  const recName = normalizePlaceName(
    (rec.name as I18nText).th ?? (rec.name as I18nText).en ?? '',
  );

  const rows = await db.execute<{
    id: string;
    slug: string;
    name: I18nText;
    status: string;
    distance_m: number;
    name_sim: number;
  }>(sql`
    SELECT p.id, p.slug, p.name, p.status,
      ST_Distance(p.geog, ir.geog) AS distance_m,
      GREATEST(
        similarity(lower(coalesce(p.name->>'th','')), ${recName}),
        similarity(lower(coalesce(p.name->>'en','')), ${recName})
      ) AS name_sim
    FROM places p, import_records ir
    WHERE ir.id = ${recordId}
      AND p.type = ir.place_type
      AND (
        ST_DWithin(p.geog, ir.geog, 150)
        OR similarity(lower(coalesce(p.name->>'th','')), ${recName}) > 0.3
        OR similarity(lower(coalesce(p.name->>'en','')), ${recName}) > 0.3
      )
    ORDER BY distance_m ASC
    LIMIT 5
  `);

  const list = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] }).rows ?? [];
  const { isLikelyDuplicate } = await import('@/lib/import-match');
  return (list as Record<string, unknown>[]).map((r) => {
    const distanceM = Math.round(Number(r.distance_m));
    const nameSimilarity = Math.round(Number(r.name_sim) * 100) / 100;
    return {
      placeId: String(r.id),
      slug: String(r.slug),
      name: r.name as I18nText,
      status: String(r.status),
      distanceM,
      nameSimilarity,
      likelyDuplicate: isLikelyDuplicate({ distanceM, nameSimilarity }),
    };
  });
}

function toSlug(rec: { source: string; sourceRef: string }): string {
  return `${rec.source}-${rec.sourceRef}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Promote a staged record to a NEW place (L4 unverified, source attribution). */
export async function importAsNew(recordId: string, actorId: string) {
  const rows = await db
    .select({
      id: importRecords.id,
      source: importRecords.source,
      sourceRef: importRecords.sourceRef,
      placeType: importRecords.placeType,
      name: importRecords.name,
      address: importRecords.address,
      status: importRecords.status,
      lat: sql<number>`ST_Y(${importRecords.geog}::geometry)`,
      lng: sql<number>`ST_X(${importRecords.geog}::geometry)`,
    })
    .from(importRecords)
    .where(eq(importRecords.id, recordId))
    .limit(1);
  const rec = rows[0];
  if (!rec || rec.status !== 'pending') throw new Error('Record not pending');

  // mosques/prayer rooms from official-ish registries can be public-unverified;
  // everything else starts as draft for a fuller review before publishing.
  const status = rec.placeType === 'mosque' || rec.placeType === 'prayer_room'
    ? 'published_unverified'
    : 'draft';

  const [place] = await db
    .insert(places)
    .values({
      type: rec.placeType,
      slug: toSlug(rec),
      name: rec.name as I18nText,
      address: rec.address as I18nText,
      geog: geog(Number(rec.lng), Number(rec.lat)) as unknown as string,
      halalStatus: 'unverified',
      halalSource: 'imported',
      status,
      dataSource: rec.source,
      sourceRef: rec.sourceRef,
      createdBy: actorId,
    })
    .returning({ id: places.id });

  await db
    .update(importRecords)
    .set({ status: 'imported', matchedPlaceId: place.id, reviewedBy: actorId, reviewedAt: new Date() })
    .where(eq(importRecords.id, recordId));

  await writeAudit({
    actorId,
    action: 'import.new',
    entityType: 'place',
    entityId: place.id,
    diff: { source: rec.source, sourceRef: rec.sourceRef },
  });
  return place.id;
}

/** Link a staged record to an existing place (duplicate) — no new place created. */
export async function mergeInto(recordId: string, placeId: string, actorId: string) {
  const rec = await db.query.importRecords.findFirst({ where: eq(importRecords.id, recordId) });
  if (!rec || rec.status !== 'pending') throw new Error('Record not pending');

  await db
    .update(importRecords)
    .set({ status: 'merged', matchedPlaceId: placeId, reviewedBy: actorId, reviewedAt: new Date() })
    .where(eq(importRecords.id, recordId));

  await writeAudit({
    actorId,
    action: 'import.merge',
    entityType: 'place',
    entityId: placeId,
    diff: { recordId, source: rec.source, sourceRef: rec.sourceRef },
  });
}

export async function rejectRecord(recordId: string, actorId: string) {
  await db
    .update(importRecords)
    .set({ status: 'rejected', reviewedBy: actorId, reviewedAt: new Date() })
    .where(and(eq(importRecords.id, recordId), eq(importRecords.status, 'pending')));
  await writeAudit({ actorId, action: 'import.reject', entityType: 'import_record', entityId: recordId });
}
