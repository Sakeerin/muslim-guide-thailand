import 'dotenv/config';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../../src/server/db/client';
import { islamicEvents } from '../../src/server/db/schema';
import { broadcast } from '../../src/server/services/push';
import type { AnnouncementContent, PushTopic } from '../../src/lib/push';
import type { I18nText } from '../../src/server/db/schema/types';

/**
 * Cron: broadcast a Web Push announcement for any Islamic event that has been
 * officially announced (announced_at set) but not yet pushed (push_sent_at
 * null). Run daily. Idempotent: push_sent_at guards against double-sending.
 * Run: pnpm cron:push-events
 */

const LOCALES = ['th', 'en', 'ms', 'id', 'ar'] as const;

function topicForKey(key: string): PushTopic {
  if (key.startsWith('ramadan')) return 'ramadan';
  if (key.startsWith('eid')) return 'eid';
  return 'events';
}

function fmtDate(gdate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale, {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
  }).format(new Date(`${gdate}T12:00:00+07:00`));
}

// Per-topic, per-locale copy. {date} is substituted per subscriber locale.
const COPY: Record<Exclude<PushTopic, 'events'>, Record<string, { title: string; body: (d: string) => string }>> = {
  ramadan: {
    th: { title: '🌙 รอมฎอนกำลังจะมาถึง', body: (d) => `รอมฎอนเริ่ม ${d} — ดูเวลาสุฮูร์และอิฟตาร์` },
    en: { title: '🌙 Ramadan is coming', body: (d) => `Ramadan begins ${d} — see suhur & iftar times` },
    ms: { title: '🌙 Ramadan menjelang', body: (d) => `Ramadan bermula ${d} — lihat waktu sahur & berbuka` },
    id: { title: '🌙 Ramadan segera tiba', body: (d) => `Ramadan dimulai ${d} — lihat waktu sahur & berbuka` },
    ar: { title: '🌙 اقترب رمضان', body: (d) => `يبدأ رمضان ${d} — مواقيت السحور والإفطار` },
  },
  eid: {
    th: { title: '🎉 อีดมุบาร็อก', body: (d) => `วันอีดตรงกับ ${d}` },
    en: { title: '🎉 Eid Mubarak', body: (d) => `Eid falls on ${d}` },
    ms: { title: '🎉 Selamat Hari Raya', body: (d) => `Hari Raya pada ${d}` },
    id: { title: '🎉 Selamat Idulfitri', body: (d) => `Hari raya pada ${d}` },
    ar: { title: '🎉 عيد مبارك', body: (d) => `العيد يوم ${d}` },
  },
};

function buildContent(ev: { key: string; gdate: string; title: string | null }): {
  content: AnnouncementContent;
  topic: PushTopic;
} {
  const topic = topicForKey(ev.key);
  const title: I18nText = {};
  const body: I18nText = {};
  for (const loc of LOCALES) {
    const d = fmtDate(ev.gdate, loc);
    if (topic === 'events') {
      title[loc] = ev.title ?? 'ประกาศ';
      body[loc] = d;
    } else {
      title[loc] = COPY[topic][loc].title;
      body[loc] = COPY[topic][loc].body(d);
    }
  }
  const path = topic === 'ramadan' ? '/ramadan' : '/islamic-calendar';
  return { content: { title, body, path, tag: ev.key }, topic };
}

async function main() {
  const pending = await db
    .select({
      key: islamicEvents.key,
      gdate: islamicEvents.gdate,
      title: islamicEvents.title,
    })
    .from(islamicEvents)
    .where(and(isNotNull(islamicEvents.announcedAt), isNull(islamicEvents.pushSentAt)));

  if (pending.length === 0) {
    console.log('[push-events] no newly-announced events to broadcast');
    process.exit(0);
  }

  for (const ev of pending) {
    const { content, topic } = buildContent(ev);
    const result = await broadcast(content, { topic, actorId: 'system:cron' });
    await db
      .update(islamicEvents)
      .set({ pushSentAt: new Date() })
      .where(eq(islamicEvents.key, ev.key));
    console.log(
      `[push-events] ${ev.key} (${topic}): sent ${result.sent}, failed ${result.failed}, pruned ${result.pruned} of ${result.total}`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
