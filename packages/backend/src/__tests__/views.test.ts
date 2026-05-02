/**
 * Views / Anzeige-Aufrufe — Integration Tests
 *
 * Testet die View-Tracking-Logik für Jobs und Ads (JobSeekerAd).
 * Läuft direkt gegen die Datenbank.
 *
 * Szenarien:
 *  1. Job View: Erster Aufruf inkrementiert views, zweiter Aufruf nicht (Deduplizierung)
 *  2. Ad View: Gleiche Logik für JobSeekerAd
 *  3. Verschiedene Viewer: Jeder neue Viewer inkrementiert den Zähler
 *  4. Ohne viewerKey: Kein View-Tracking (views bleibt 0)
 *  5. ProfileView: Wird korrekt erstellt, Self-View wird ignoriert
 *  6. ProfileView Deduplizierung: Doppelter View erstellt keinen zweiten Eintrag
 *  7. getProfileViewers: Premium vs Non-Premium Ergebnisse
 *  8. Employer Analytics: views werden korrekt aggregiert
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Test-Konstanten ────────────────────────────────────────
const TEST_EMPLOYER_ID = '__test_views_employer__';
const TEST_EMPLOYER_EMAIL = '__views_employer__@test.local';
const TEST_VIEWER_ID = '__test_views_viewer__';
const TEST_VIEWER_EMAIL = '__views_viewer__@test.local';
const TEST_VIEWER2_ID = '__test_views_viewer2__';
const TEST_VIEWER2_EMAIL = '__views_viewer2__@test.local';

let passed = 0;
let failed = 0;
const failures: string[] = [];

// ─── Helpers ────────────────────────────────────────────────

function assertEquals(actual: any, expected: any, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: erwartet ${JSON.stringify(expected)}, bekommen ${JSON.stringify(actual)}`);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    const msg = `${name}: ${err.message}`;
    failures.push(msg);
    console.log(`  ✗ ${name}`);
    console.log(`    → ${err.message}`);
  }
}

// ─── Service-Funktionen (1:1 wie im Produktivcode) ──────────

async function getJobById(id: string, viewerKey?: string) {
  let job = await prisma.job.findUnique({
    where: { id },
    include: { images: true, user: { select: { displayName: true } } },
  });
  if (job && viewerKey) {
    try {
      await prisma.uniqueView.create({
        data: { targetType: 'job', targetId: id, viewerKey },
      });
      job = await prisma.job.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: { images: true, user: { select: { displayName: true } } },
      });
    } catch {
      // unique constraint violation → already viewed
    }
  }
  return job;
}

async function getAdById(id: string, viewerKey?: string) {
  let ad = await prisma.jobSeekerAd.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });
  if (!ad) return null;
  if (viewerKey) {
    try {
      await prisma.uniqueView.create({
        data: { targetType: 'ad', targetId: id, viewerKey },
      });
      ad = await prisma.jobSeekerAd.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: { user: { select: { displayName: true } } },
      });
    } catch {
      // unique constraint violation → already viewed
    }
  }
  return ad;
}

async function recordProfileView(
  viewerId: string, viewedId: string, targetType: 'job' | 'ad', targetId: string
) {
  if (viewerId === viewedId) return null;
  try {
    return await prisma.profileView.create({
      data: { viewerId, viewedId, targetType, targetId },
    });
  } catch {
    return null;
  }
}

async function getProfileViewers(userId: string, isPremium: boolean) {
  const views = await prisma.profileView.findMany({
    where: { viewedId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  if (!isPremium) {
    return { count: views.length, viewers: [], locked: true };
  }
  const enriched = await Promise.all(
    views.map(async (v: any) => {
      const viewer = await prisma.user.findUnique({
        where: { id: v.viewerId },
        select: { id: true, displayName: true, image: true, role: true },
      });
      return {
        id: v.id,
        viewerId: v.viewerId,
        viewerName: viewer?.displayName || 'Unbekannt',
        viewerImage: viewer?.image || null,
        viewerRole: viewer?.role || 'job-seeker',
        targetType: v.targetType,
        targetId: v.targetId,
        createdAt: v.createdAt,
      };
    })
  );
  return { count: views.length, viewers: enriched, locked: false };
}

async function getEmployerAnalytics(userId: string) {
  const jobs = await prisma.job.findMany({
    where: { userId },
    select: { id: true, category: true, companyName: true, status: true, views: true, shares: true, locationCity: true, locationState: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const totalViews = jobs.reduce((s, j) => s + j.views, 0);
  return { totals: { totalJobs: jobs.length, totalViews }, jobs };
}

// ─── Setup & Cleanup ────────────────────────────────────────

let testJobId: string;
let testAdId: string;

async function setup() {
  await cleanup();

  // Create test users
  await prisma.user.create({
    data: {
      id: TEST_EMPLOYER_ID,
      email: TEST_EMPLOYER_EMAIL,
      displayName: 'Test Employer Views',
      password: 'not-a-real-hash',
      role: 'employer',
    },
  });
  await prisma.user.create({
    data: {
      id: TEST_VIEWER_ID,
      email: TEST_VIEWER_EMAIL,
      displayName: 'Test Viewer',
      password: 'not-a-real-hash',
      role: 'job-seeker',
    },
  });
  await prisma.user.create({
    data: {
      id: TEST_VIEWER2_ID,
      email: TEST_VIEWER2_EMAIL,
      displayName: 'Test Viewer 2',
      password: 'not-a-real-hash',
      role: 'job-seeker',
    },
  });

  // Create a test job
  const job = await prisma.job.create({
    data: {
      userId: TEST_EMPLOYER_ID,
      category: 'Tester',
      contactName: 'Max',
      contactSurname: 'Test',
      contactPhone: '+41 79 000 00 00',
      locationState: 'Zürich',
      locationCity: 'Zürich',
      status: 'Active',
    },
  });
  testJobId = job.id;

  // Create a test ad
  const ad = await prisma.jobSeekerAd.create({
    data: {
      userId: TEST_VIEWER_ID,
      category: 'Tester',
      firstName: 'Anna',
      surname: 'Test',
      phone: '+41 79 000 00 01',
    },
  });
  testAdId = ad.id;
}

async function cleanup() {
  // Clean up in correct order (foreign keys)
  await prisma.uniqueView.deleteMany({
    where: { targetId: { in: [testJobId, testAdId].filter(Boolean) } },
  });
  await prisma.profileView.deleteMany({
    where: {
      OR: [
        { viewerId: { in: [TEST_EMPLOYER_ID, TEST_VIEWER_ID, TEST_VIEWER2_ID] } },
        { viewedId: { in: [TEST_EMPLOYER_ID, TEST_VIEWER_ID, TEST_VIEWER2_ID] } },
      ],
    },
  });
  await prisma.jobSeekerAd.deleteMany({
    where: { userId: { in: [TEST_EMPLOYER_ID, TEST_VIEWER_ID, TEST_VIEWER2_ID] } },
  });
  await prisma.job.deleteMany({
    where: { userId: { in: [TEST_EMPLOYER_ID, TEST_VIEWER_ID, TEST_VIEWER2_ID] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [TEST_EMPLOYER_ID, TEST_VIEWER_ID, TEST_VIEWER2_ID] } },
  });
}

// ─── Test Runner ────────────────────────────────────────────

async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           Views / Anzeige-Aufrufe — Tests                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 1: Job View — Erster Aufruf + Deduplizierung
  // ══════════════════════════════════════════════════════════════
  console.log('── Szenario 1: Job View Tracking ──');
  await setup();

  await test('1.1 Job hat initial 0 views', async () => {
    const job = await prisma.job.findUnique({ where: { id: testJobId } });
    assertEquals(job!.views, 0, 'views');
  });

  await test('1.2 Erster Aufruf inkrementiert views auf 1', async () => {
    const job = await getJobById(testJobId, TEST_VIEWER_ID);
    assertEquals(job!.views, 1, 'views');
  });

  await test('1.3 UniqueView-Eintrag wurde erstellt', async () => {
    const uv = await prisma.uniqueView.findFirst({
      where: { targetType: 'job', targetId: testJobId, viewerKey: TEST_VIEWER_ID },
    });
    assertEquals(uv !== null, true, 'UniqueView existiert');
  });

  await test('1.4 Zweiter Aufruf gleicher Viewer → views bleibt 1 (Deduplizierung)', async () => {
    const job = await getJobById(testJobId, TEST_VIEWER_ID);
    assertEquals(job!.views, 1, 'views');
  });

  await test('1.5 Nur 1 UniqueView-Eintrag (kein Duplikat)', async () => {
    const count = await prisma.uniqueView.count({
      where: { targetType: 'job', targetId: testJobId, viewerKey: TEST_VIEWER_ID },
    });
    assertEquals(count, 1, 'UniqueView count');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 2: Ad View — Gleiche Logik für JobSeekerAd
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 2: Ad View Tracking ──');

  await test('2.1 Ad hat initial 0 views', async () => {
    const ad = await prisma.jobSeekerAd.findUnique({ where: { id: testAdId } });
    assertEquals(ad!.views, 0, 'views');
  });

  await test('2.2 Erster Aufruf inkrementiert Ad views auf 1', async () => {
    const ad = await getAdById(testAdId, TEST_EMPLOYER_ID);
    assertEquals(ad!.views, 1, 'views');
  });

  await test('2.3 Zweiter Aufruf gleicher Viewer → Ad views bleibt 1', async () => {
    const ad = await getAdById(testAdId, TEST_EMPLOYER_ID);
    assertEquals(ad!.views, 1, 'views');
  });

  await test('2.4 UniqueView für Ad existiert mit targetType "ad"', async () => {
    const uv = await prisma.uniqueView.findFirst({
      where: { targetType: 'ad', targetId: testAdId, viewerKey: TEST_EMPLOYER_ID },
    });
    assertEquals(uv !== null, true, 'UniqueView existiert');
    assertEquals(uv!.targetType, 'ad', 'targetType');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 3: Verschiedene Viewer inkrementieren den Zähler
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 3: Verschiedene Viewer ──');

  await test('3.1 Zweiter Viewer → Job views steigt auf 2', async () => {
    const job = await getJobById(testJobId, TEST_VIEWER2_ID);
    assertEquals(job!.views, 2, 'views');
  });

  await test('3.2 Dritter Viewer (IP-basiert) → Job views steigt auf 3', async () => {
    const job = await getJobById(testJobId, '192.168.1.100');
    assertEquals(job!.views, 3, 'views');
  });

  await test('3.3 Nochmal gleiche IP → views bleibt 3', async () => {
    const job = await getJobById(testJobId, '192.168.1.100');
    assertEquals(job!.views, 3, 'views');
  });

  await test('3.4 Andere IP → Job views steigt auf 4', async () => {
    const job = await getJobById(testJobId, '10.0.0.1');
    assertEquals(job!.views, 4, 'views');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 4: Ohne viewerKey → kein Tracking
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 4: Ohne viewerKey ──');

  await test('4.1 Aufruf ohne viewerKey → views ändert sich nicht', async () => {
    const before = await prisma.job.findUnique({ where: { id: testJobId } });
    const job = await getJobById(testJobId); // kein viewerKey
    assertEquals(job!.views, before!.views, 'views unverändert');
  });

  await test('4.2 Kein neuer UniqueView ohne viewerKey', async () => {
    const count = await prisma.uniqueView.count({
      where: { targetType: 'job', targetId: testJobId },
    });
    assertEquals(count, 4, 'UniqueView count'); // viewer1 + viewer2 + 2 IPs
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 5: ProfileView — Tracking und Self-View
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 5: ProfileView Tracking ──');

  await test('5.1 ProfileView wird erstellt wenn Viewer ≠ Owner', async () => {
    const pv = await recordProfileView(TEST_VIEWER_ID, TEST_EMPLOYER_ID, 'job', testJobId);
    assertEquals(pv !== null, true, 'ProfileView erstellt');
    assertEquals(pv!.viewerId, TEST_VIEWER_ID, 'viewerId');
    assertEquals(pv!.viewedId, TEST_EMPLOYER_ID, 'viewedId');
    assertEquals(pv!.targetType, 'job', 'targetType');
  });

  await test('5.2 Self-View wird ignoriert (return null)', async () => {
    const pv = await recordProfileView(TEST_EMPLOYER_ID, TEST_EMPLOYER_ID, 'job', testJobId);
    assertEquals(pv, null, 'Self-View');
  });

  await test('5.3 Self-View erzeugt keinen DB-Eintrag', async () => {
    const count = await prisma.profileView.count({
      where: { viewerId: TEST_EMPLOYER_ID, viewedId: TEST_EMPLOYER_ID },
    });
    assertEquals(count, 0, 'Keine Self-View Einträge');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 6: ProfileView Deduplizierung
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 6: ProfileView Deduplizierung ──');

  await test('6.1 Zweiter ProfileView vom selben Viewer → null (Deduplizierung)', async () => {
    const pv = await recordProfileView(TEST_VIEWER_ID, TEST_EMPLOYER_ID, 'job', testJobId);
    assertEquals(pv, null, 'Duplikat');
  });

  await test('6.2 Nur 1 ProfileView-Eintrag in DB', async () => {
    const count = await prisma.profileView.count({
      where: { viewerId: TEST_VIEWER_ID, viewedId: TEST_EMPLOYER_ID, targetType: 'job', targetId: testJobId },
    });
    assertEquals(count, 1, 'ProfileView count');
  });

  await test('6.3 Anderer Viewer → neuer ProfileView wird erstellt', async () => {
    const pv = await recordProfileView(TEST_VIEWER2_ID, TEST_EMPLOYER_ID, 'job', testJobId);
    assertEquals(pv !== null, true, 'Neuer ProfileView');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 7: getProfileViewers — Premium vs Non-Premium
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 7: ProfileViewers Premium/Non-Premium ──');

  await test('7.1 Non-Premium: nur count, keine Details, locked=true', async () => {
    const result = await getProfileViewers(TEST_EMPLOYER_ID, false);
    assertEquals(result.locked, true, 'locked');
    assertEquals(result.viewers.length, 0, 'viewers leer');
    assertEquals(result.count, 2, 'count'); // viewer1 + viewer2
  });

  await test('7.2 Premium: viewers mit Details, locked=false', async () => {
    const result = await getProfileViewers(TEST_EMPLOYER_ID, true);
    assertEquals(result.locked, false, 'locked');
    assertEquals(result.count, 2, 'count');
    assertEquals(result.viewers.length, 2, 'viewers Anzahl');
  });

  await test('7.3 Premium: Viewer-Details korrekt angereichert', async () => {
    const result = await getProfileViewers(TEST_EMPLOYER_ID, true);
    const viewer = result.viewers.find((v: any) => v.viewerId === TEST_VIEWER_ID);
    assertEquals(viewer !== undefined, true, 'Viewer gefunden');
    assertEquals(viewer!.viewerName, 'Test Viewer', 'viewerName');
    assertEquals(viewer!.viewerRole, 'job-seeker', 'viewerRole');
    assertEquals(viewer!.targetType, 'job', 'targetType');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 8: Employer Analytics — Views aggregiert
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 8: Employer Analytics ──');

  await test('8.1 totalViews korrekt aggregiert', async () => {
    const analytics = await getEmployerAnalytics(TEST_EMPLOYER_ID);
    assertEquals(analytics.totals.totalJobs, 1, 'totalJobs');
    assertEquals(analytics.totals.totalViews, 4, 'totalViews'); // 4 unique viewers
  });

  await test('8.2 Per-Job views korrekt', async () => {
    const analytics = await getEmployerAnalytics(TEST_EMPLOYER_ID);
    const jobStat = analytics.jobs.find((j) => j.id === testJobId);
    assertEquals(jobStat !== undefined, true, 'Job in Analytics');
    assertEquals(jobStat!.views, 4, 'Job views');
  });

  // Zweiten Job erstellen für Multi-Job-Analytics
  const job2 = await prisma.job.create({
    data: {
      userId: TEST_EMPLOYER_ID,
      category: 'Cleaner',
      contactName: 'Max',
      contactSurname: 'Test',
      contactPhone: '+41 79 000 00 00',
      locationState: 'Bern',
      locationCity: 'Bern',
      status: 'Active',
    },
  });

  // 2 Views auf Job2
  await getJobById(job2.id, TEST_VIEWER_ID);
  await getJobById(job2.id, TEST_VIEWER2_ID);

  await test('8.3 Multi-Job: totalViews summiert beide Jobs', async () => {
    const analytics = await getEmployerAnalytics(TEST_EMPLOYER_ID);
    assertEquals(analytics.totals.totalJobs, 2, 'totalJobs');
    assertEquals(analytics.totals.totalViews, 6, 'totalViews'); // 4 + 2
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 9: Edge Cases
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 9: Edge Cases ──');

  await test('9.1 getJobById mit nicht-existierender ID → null', async () => {
    const job = await getJobById('non-existent-id', TEST_VIEWER_ID);
    assertEquals(job, null, 'Job nicht gefunden');
  });

  await test('9.2 getAdById mit nicht-existierender ID → null', async () => {
    const ad = await getAdById('non-existent-id', TEST_VIEWER_ID);
    assertEquals(ad, null, 'Ad nicht gefunden');
  });

  await test('9.3 Owner viewt eigenen Job → View wird NICHT gezählt (Owner-Check im Controller)', async () => {
    const before = await prisma.job.findUnique({ where: { id: testJobId } });
    // Simuliert Controller-Logik: Owner bekommt keinen viewerKey
    const job = await getJobById(testJobId); // kein viewerKey für Owner
    assertEquals(job!.views, before!.views, 'views unverändert');
  });

  await test('9.4 Owner viewt eigene Ad → View wird NICHT gezählt', async () => {
    const before = await prisma.jobSeekerAd.findUnique({ where: { id: testAdId } });
    const ad = await getAdById(testAdId); // kein viewerKey für Owner
    assertEquals(ad!.views, before!.views, 'views unverändert');
  });

  // ══════════════════════════════════════════════════════════════
  await cleanup();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  if (failed === 0) {
    console.log(`║  ✓ ALLE ${passed} TESTS BESTANDEN                                   ║`);
  } else {
    console.log(`║  ✗ ${failed} FEHLGESCHLAGEN, ${passed} bestanden (${passed + failed} total)                  ║`);
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  if (failures.length > 0) {
    console.log('');
    console.log('Fehlgeschlagene Tests:');
    failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  }

  console.log('');
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (err) => {
  console.error('Test-Runner Fehler:', err);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
