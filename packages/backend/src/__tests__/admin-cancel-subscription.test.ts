/**
 * Admin: Cancel Subscription — Unit Tests
 *
 * Testet `adminCancelSubscription` aus stripe.service.ts gegen eine echte
 * Datenbank mit einem gestubbten Stripe-Client (via __setStripeClientForTest).
 *
 * Szenarien:
 *  1. period_end: setzt cancelAtPeriodEnd=true, Status bleibt active, User behält isPremium
 *  2. immediate: Status → canceled, User verliert isPremium wenn keine andere Sub läuft
 *  3. immediate mit zweiter aktiver Sub: isPremium bleibt true
 *  4. Sub nicht gefunden → Error
 *  5. Sub bereits canceled → Error
 *  6. Stripe wird mit dem richtigen sub-ID aufgerufen (period_end und immediate)
 */

import { PrismaClient } from '@prisma/client';
import { adminCancelSubscription, __setStripeClientForTest } from '../services/stripe.service';

const prisma = new PrismaClient();

const TEST_USER_ID = '__test_cancel_uid__';
const TEST_USER_EMAIL = '__cancel_test__@test.local';
const SUB_A = 'sub_test_cancel_A';
const SUB_B = 'sub_test_cancel_B';

// ─── Stub Stripe — records calls, returns minimal successful responses ──

type StubCall = { method: string; args: any[] };
let stripeCalls: StubCall[] = [];
let stripeThrows: Error | null = null;

function makeStripeStub() {
  return {
    subscriptions: {
      cancel: async (...args: any[]) => {
        stripeCalls.push({ method: 'cancel', args });
        if (stripeThrows) throw stripeThrows;
        return { id: args[0], status: 'canceled' };
      },
      update: async (...args: any[]) => {
        stripeCalls.push({ method: 'update', args });
        if (stripeThrows) throw stripeThrows;
        return { id: args[0], status: 'active', cancel_at_period_end: true };
      },
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────

async function cleanup() {
  await prisma.subscription.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
}

async function seedUser(isPremium = true) {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      password: 'x',
      role: 'employer',
      isPremium,
    },
    update: { isPremium },
  });
}

async function seedSub(stripeSubId: string, status: string = 'active'): Promise<string> {
  const sub = await prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSubId },
    create: {
      userId: TEST_USER_ID,
      stripeSubscriptionId: stripeSubId,
      stripePriceId: 'price_test',
      status,
      planDurationMonths: 1,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000),
      cancelAtPeriodEnd: false,
    },
    update: { status, cancelAtPeriodEnd: false, canceledAt: null },
  });
  return sub.id;
}

// ─── Micro test runner (same pattern as stripe-premium.test.ts) ─────

let passed = 0, failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  // reset stub state before each test
  stripeCalls = [];
  stripeThrows = null;
  __setStripeClientForTest(makeStripeStub());
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ─── Tests ───────────────────────────────────────────────────

async function runTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Admin: Cancel Subscription — Unit Tests                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  await cleanup();

  // ─── Scenario 1: period_end — soft cancel ──────────────────
  await test('1. period_end: Stripe.update wird aufgerufen, Sub bleibt active mit cancelAtPeriodEnd=true', async () => {
    await seedUser(true);
    const dbId = await seedSub(SUB_A, 'active');

    const result = await adminCancelSubscription(dbId, 'period_end');

    assert(result.success, 'result.success must be true');
    assertEqual(result.canceledNow, false, 'canceledNow');
    assertEqual(stripeCalls.length, 1, 'stripe calls count');
    assertEqual(stripeCalls[0].method, 'update', 'stripe method');
    assertEqual(stripeCalls[0].args[0], SUB_A, 'stripe called with correct sub id');
    assertEqual(stripeCalls[0].args[1].cancel_at_period_end, true, 'cancel_at_period_end flag');

    const sub = await prisma.subscription.findUnique({ where: { id: dbId } });
    assertEqual(sub!.status, 'active', 'status stays active');
    assertEqual(sub!.cancelAtPeriodEnd, true, 'cancelAtPeriodEnd in DB');
    assert(sub!.canceledAt != null, 'canceledAt is set');

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    assertEqual(user!.isPremium, true, 'user remains premium');
  });

  await cleanup();

  // ─── Scenario 2: immediate — only sub → isPremium flips off ──
  await test('2. immediate (einzige Sub): Status → canceled, isPremium → false', async () => {
    await seedUser(true);
    const dbId = await seedSub(SUB_A, 'active');

    const result = await adminCancelSubscription(dbId, 'immediate');

    assertEqual(result.canceledNow, true, 'canceledNow');
    assertEqual(stripeCalls[0].method, 'cancel', 'stripe method');
    assertEqual(stripeCalls[0].args[0], SUB_A, 'stripe called with correct sub id');

    const sub = await prisma.subscription.findUnique({ where: { id: dbId } });
    assertEqual(sub!.status, 'canceled', 'status canceled');
    assertEqual(sub!.cancelAtPeriodEnd, false, 'cancelAtPeriodEnd false');

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    assertEqual(user!.isPremium, false, 'isPremium flipped off');
  });

  await cleanup();

  // ─── Scenario 3: immediate — another active sub → isPremium stays ──
  await test('3. immediate mit zweiter aktiver Sub: isPremium bleibt true', async () => {
    await seedUser(true);
    const dbIdA = await seedSub(SUB_A, 'active');
    await seedSub(SUB_B, 'active'); // second active sub for same user

    await adminCancelSubscription(dbIdA, 'immediate');

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    assertEqual(user!.isPremium, true, 'isPremium stays true (sub B is still active)');

    const subA = await prisma.subscription.findUnique({ where: { id: dbIdA } });
    assertEqual(subA!.status, 'canceled', 'sub A canceled');
  });

  await cleanup();

  // ─── Scenario 4: sub not found ─────────────────────────────
  await test('4. Sub not found → Error', async () => {
    let thrown: any = null;
    try {
      await adminCancelSubscription('nonexistent_id', 'period_end');
    } catch (err) {
      thrown = err;
    }
    assert(thrown != null, 'must throw');
    assertEqual(thrown.message, 'Subscription not found', 'error message');
    assertEqual(stripeCalls.length, 0, 'Stripe must NOT be called');
  });

  await cleanup();

  // ─── Scenario 5: already canceled ─────────────────────────
  await test('5. Sub bereits canceled → Error, kein Stripe-Call', async () => {
    await seedUser(false);
    const dbId = await seedSub(SUB_A, 'canceled');

    let thrown: any = null;
    try {
      await adminCancelSubscription(dbId, 'period_end');
    } catch (err) {
      thrown = err;
    }
    assert(thrown != null, 'must throw');
    assertEqual(thrown.message, 'Subscription is already canceled', 'error message');
    assertEqual(stripeCalls.length, 0, 'Stripe must NOT be called');
  });

  await cleanup();

  // ─── Scenario 6: Stripe throws → error bubbles, DB unchanged ──
  await test('6. Stripe wirft Fehler → DB bleibt unverändert', async () => {
    await seedUser(true);
    const dbId = await seedSub(SUB_A, 'active');
    stripeThrows = new Error('Stripe API down');

    let thrown: any = null;
    try {
      await adminCancelSubscription(dbId, 'period_end');
    } catch (err) {
      thrown = err;
    }
    assert(thrown != null, 'must throw');

    const sub = await prisma.subscription.findUnique({ where: { id: dbId } });
    assertEqual(sub!.status, 'active', 'status unchanged');
    assertEqual(sub!.cancelAtPeriodEnd, false, 'cancelAtPeriodEnd unchanged');

    const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
    assertEqual(user!.isPremium, true, 'isPremium unchanged');
  });

  await cleanup();

  // ─── Result ────────────────────────────────────────────────
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
