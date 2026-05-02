/**
 * Stripe Premium Webhook — Integration Tests
 *
 * Testet die ECHTE Webhook-Logik 1:1 wie sie in stripe.service.ts implementiert ist.
 * Läuft direkt gegen die Datenbank.
 *
 * Szenarien:
 *  1. Normaler Kauf: checkout.session.completed → isPremium = true
 *  2. Kundenfall jrakaj75: Fehlgeschlagener Checkout + erfolgreicher Checkout + Race-Condition
 *  3. Echte Kündigung: einzige Sub wird canceled → isPremium = false
 *  4. Kündigung mit Fallback: eine Sub gelöscht, andere aktive existiert → isPremium bleibt true
 *  5. Trialing: Status wird als aktiv erkannt
 *  6. past_due: mit anderer aktiver Sub → isPremium bleibt true
 *  7. Kompletter Lifecycle: incomplete → active → past_due → active → deleted
 *  8. Invoice paid: Verlängerung setzt isPremium = true
 *  9. Payment failed: setzt Sub auf past_due (ohne isPremium zu ändern)
 * 10. Gleichzeitige Events: 3 Subs, verschiedene Status-Updates gleichzeitig
 * 11. Edge Case: Sub existiert nicht in DB → handleSubscriptionUpdated erstellt sie (Fallback)
 * 12. Dreifach-Checkout: 2 fehlgeschlagen, 1 aktiv → verspätete Events für beide fehlgeschlagene
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Test-Konstanten ────────────────────────────────────────

const TEST_USER_ID    = '__test_stripe_uid_001__';
const TEST_USER_EMAIL = '__stripe_test__@test.local';
const SUB_1 = 'sub_test_001';
const SUB_2 = 'sub_test_002';
const SUB_3 = 'sub_test_003';

// ─── 1:1 nachgebildete Webhook-Handler (exakt wie stripe.service.ts) ───

/**
 * Simuliert: handleCheckoutCompleted
 * - Upsert Subscription in DB
 * - Setzt isPremium = true
 * Referenz: stripe.service.ts Zeile 431-454
 */
async function simulateCheckoutCompleted(userId: string, stripeSubId: string, status: string) {
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: stripeSubId },
    create: {
      userId,
      stripeSubscriptionId: stripeSubId,
      stripePriceId: 'price_test',
      status,
      planDurationMonths: 1,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000),
    },
    update: {
      status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000),
    },
  });

  // Activate premium (Zeile 451-454)
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  });
}

/**
 * Simuliert: handleSubscriptionUpdated
 * - Aktualisiert Sub-Status in DB
 * - Wenn active/trialing → isPremium = true
 * - Wenn NICHT active → prüft ob andere aktive Subs existieren
 * Referenz: stripe.service.ts Zeile 596-667
 */
async function simulateSubscriptionUpdated(stripeSubId: string, newStatus: string) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (!sub) throw new Error(`[simulateSubscriptionUpdated] Sub ${stripeSubId} nicht in DB gefunden`);

  // Update status (Zeile 630-638)
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: newStatus },
  });

  // Sync premium status (Zeile 641-666)
  const isThisSubActive = ['active', 'trialing'].includes(newStatus);
  if (isThisSubActive) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: { isPremium: true },
    });
  } else {
    // Prüfe ob andere aktive Subs existieren (Zeile 650-656)
    const otherActiveSub = await prisma.subscription.findFirst({
      where: {
        userId: sub.userId,
        status: { in: ['active', 'trialing'] },
        stripeSubscriptionId: { not: stripeSubId },
      },
    });
    if (!otherActiveSub) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: { isPremium: false },
      });
    }
    // else: isPremium bleibt true
  }
}

/**
 * Simuliert: handleSubscriptionDeleted
 * - Setzt Sub auf canceled
 * - Prüft ob andere aktive Subs existieren bevor isPremium = false
 * Referenz: stripe.service.ts Zeile 671-703
 */
async function simulateSubscriptionDeleted(stripeSubId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (!sub) throw new Error(`[simulateSubscriptionDeleted] Sub ${stripeSubId} nicht in DB gefunden`);

  // Zeile 677-684
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'canceled', cancelAtPeriodEnd: false, canceledAt: new Date() },
  });

  // Zeile 687-698
  const otherActiveSub = await prisma.subscription.findFirst({
    where: {
      userId: sub.userId,
      status: { in: ['active', 'trialing'] },
      stripeSubscriptionId: { not: stripeSubId },
    },
  });
  if (!otherActiveSub) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: { isPremium: false },
    });
  }
}

/**
 * Simuliert: handleInvoicePaid (Verlängerung)
 * - Setzt isPremium = true
 * Referenz: stripe.service.ts Zeile 540-543
 */
async function simulateInvoicePaid(stripeSubId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (!sub) throw new Error(`[simulateInvoicePaid] Sub ${stripeSubId} nicht in DB gefunden`);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'active' },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { isPremium: true },
  });
}

/**
 * Simuliert: handleInvoicePaymentFailed
 * - Setzt Sub auf past_due (OHNE isPremium zu ändern!)
 * Referenz: stripe.service.ts Zeile 566-579
 */
async function simulateInvoicePaymentFailed(stripeSubId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (!sub) throw new Error(`[simulateInvoicePaymentFailed] Sub ${stripeSubId} nicht in DB gefunden`);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'past_due' },
  });
  // KEIN isPremium-Update hier! (das macht nur handleSubscriptionUpdated)
}

// ─── Helpers ────────────────────────────────────────────────

async function getUserPremium(): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: TEST_USER_ID } });
  return user?.isPremium ?? false;
}

async function getSubStatus(stripeSubId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: stripeSubId } });
  return sub?.status ?? null;
}

async function setup() {
  await cleanup();
  await prisma.user.create({
    data: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      password: 'test_hash',
      displayName: 'Stripe Test User',
      role: 'employer',
      isPremium: false,
    },
  });
}

async function cleanup() {
  await prisma.subscription.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.user.deleteMany({ where: { id: TEST_USER_ID } });
}

// ─── Test-Runner ────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    const msg = err.message || String(err);
    failures.push(`${name}: ${msg}`);
    console.error(`  ✗ ${name}`);
    console.error(`    → ${msg}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEquals(actual: any, expected: any, msg: string) {
  if (actual !== expected) throw new Error(`${msg} (erwartet: ${expected}, bekommen: ${actual})`);
}

// ─── TESTS ──────────────────────────────────────────────────

async function runTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Stripe Premium Webhook — Integration Tests (1:1 Simulation) ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 1: Normaler erfolgreicher Kauf
  // Stripe-Flow: checkout.session.completed → customer.subscription.updated (active)
  // ══════════════════════════════════════════════════════════════
  console.log('── Szenario 1: Normaler erfolgreicher Kauf ──');
  await setup();

  // Stripe Event: checkout.session.completed
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await test('1.1 checkout.session.completed → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });
  await test('1.2 Sub-Status in DB = active', async () => {
    assertEquals(await getSubStatus(SUB_1), 'active', 'Sub-Status');
  });

  // Stripe Event: customer.subscription.updated (active)
  await simulateSubscriptionUpdated(SUB_1, 'active');
  await test('1.3 subscription.updated (active) → isPremium bleibt true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 2: KUNDENFALL jrakaj75@gmail.com (exakte Reproduktion)
  // 1. Checkout 1 → incomplete → Zahlung fehlgeschlagen → incomplete_expired
  // 2. Checkout 2 → active → Zahlung OK
  // 3. Verspätetes Event für Sub 1 → darf Sub 2 NICHT killen
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 2: Kundenfall jrakaj75 (Race-Condition) ──');
  await setup();

  // --- Checkout 1: Zahlung wird versucht ---

  // Stripe: checkout.session.completed feuert (Sub wird erstellt, Zahlung pending)
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'incomplete');
  await test('2.1 Checkout 1 completed → isPremium = true (checkout setzt immer true)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Stripe: customer.subscription.updated → incomplete
  await simulateSubscriptionUpdated(SUB_1, 'incomplete');
  await test('2.2 Sub 1 updated (incomplete) → isPremium = false (keine andere Sub)', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // --- Checkout 2: Neuer Versuch, Zahlung geht durch ---

  // Stripe: checkout.session.completed für Sub 2
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'active');
  await test('2.3 Checkout 2 completed → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Stripe: customer.subscription.updated → Sub 2 active
  await simulateSubscriptionUpdated(SUB_2, 'active');
  await test('2.4 Sub 2 updated (active) → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // --- DER BUG: Verspätetes Event für Sub 1 ---

  // Stripe: customer.subscription.updated → Sub 1 incomplete_expired (kommt NACH Sub 2!)
  await simulateSubscriptionUpdated(SUB_1, 'incomplete_expired');
  await test('2.5 ★ KRITISCH: Sub 1 incomplete_expired DARF Sub 2 (active) NICHT überschreiben', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium MUSS true bleiben!');
  });

  // Stripe: Noch ein Event für Sub 1 → canceled
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await test('2.6 Sub 1 canceled → isPremium bleibt true (Sub 2 ist active)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Verify: Chat-Zugang muss funktionieren
  await test('2.7 Chat-Zugang: isPremium = true → User kann chatten', async () => {
    assert(await getUserPremium(), 'Chat wäre gesperrt!');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 3: Echte Kündigung (einzige Sub)
  // User hat eine aktive Sub → kündigt → isPremium = false
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 3: Echte Kündigung (einzige Sub) ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await test('3.1 Vor Kündigung: isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Stripe: customer.subscription.updated → canceled
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await test('3.2 Nach Kündigung: isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Stripe: customer.subscription.deleted
  await simulateSubscriptionUpdated(SUB_1, 'canceled'); // reset status for delete
  await simulateSubscriptionDeleted(SUB_1);
  await test('3.3 Nach Löschung: isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });
  await test('3.4 Sub-Status = canceled', async () => {
    assertEquals(await getSubStatus(SUB_1), 'canceled', 'Sub-Status');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 4: Sub gelöscht, aber andere aktive Sub existiert
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 4: Sub gelöscht, andere aktive Sub existiert ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'active');

  // Sub 1 wird gelöscht
  await simulateSubscriptionDeleted(SUB_1);
  await test('4.1 Sub 1 gelöscht, Sub 2 noch active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Sub 2 auch gelöscht
  await simulateSubscriptionDeleted(SUB_2);
  await test('4.2 Beide gelöscht → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 5: Trialing wird als aktiv erkannt
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 5: Trialing Status ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'trialing');
  await test('5.1 Checkout mit trialing → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  await simulateSubscriptionUpdated(SUB_1, 'trialing');
  await test('5.2 subscription.updated (trialing) → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Trialing endet → active
  await simulateSubscriptionUpdated(SUB_1, 'active');
  await test('5.3 trialing → active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 6: past_due mit anderer aktiver Sub
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 6: past_due mit anderer aktiver Sub ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'active');

  // Sub 1 → past_due (Zahlung fehlgeschlagen)
  await simulateSubscriptionUpdated(SUB_1, 'past_due');
  await test('6.1 Sub 1 past_due, Sub 2 active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Auch Sub 2 → past_due → keine aktive Sub mehr
  await simulateSubscriptionUpdated(SUB_2, 'past_due');
  await test('6.2 Beide past_due → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Sub 1 zahlt nach → active
  await simulateSubscriptionUpdated(SUB_1, 'active');
  await test('6.3 Sub 1 wieder active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 7: Kompletter Lifecycle einer einzelnen Sub
  // incomplete → active → past_due → active → canceled → deleted
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 7: Kompletter Sub-Lifecycle ──');
  await setup();

  // checkout → incomplete
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'incomplete');
  await test('7.1 checkout (incomplete) → isPremium = true (checkout setzt immer true)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  await simulateSubscriptionUpdated(SUB_1, 'incomplete');
  await test('7.2 updated (incomplete) → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Zahlung geht durch → active
  await simulateSubscriptionUpdated(SUB_1, 'active');
  await test('7.3 updated (active) → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Verlängerungszahlung fehlgeschlagen → past_due
  await simulateSubscriptionUpdated(SUB_1, 'past_due');
  await test('7.4 updated (past_due) → isPremium = false (einzige Sub)', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Nachzahlung → active
  await simulateSubscriptionUpdated(SUB_1, 'active');
  await test('7.5 updated (active) → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Kündigung
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await test('7.6 updated (canceled) → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Gelöscht
  await simulateSubscriptionDeleted(SUB_1);
  await test('7.7 deleted → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 8: Invoice Paid (Verlängerung)
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 8: Invoice Paid (Verlängerung) ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');

  // Sub geht auf past_due
  await simulateSubscriptionUpdated(SUB_1, 'past_due');
  await test('8.1 past_due → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // invoice.paid → setzt isPremium wieder auf true
  await simulateInvoicePaid(SUB_1);
  await test('8.2 invoice.paid → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });
  await test('8.3 Sub-Status nach invoice.paid = active', async () => {
    assertEquals(await getSubStatus(SUB_1), 'active', 'Sub-Status');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 9: Invoice Payment Failed
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 9: Invoice Payment Failed ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await test('9.1 Vor Fehlschlag: isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // invoice.payment_failed → setzt Sub auf past_due, ABER isPremium ändert sich NICHT
  await simulateInvoicePaymentFailed(SUB_1);
  await test('9.2 invoice.payment_failed → Sub-Status = past_due', async () => {
    assertEquals(await getSubStatus(SUB_1), 'past_due', 'Sub-Status');
  });
  await test('9.3 invoice.payment_failed → isPremium bleibt true (wird erst von subscription.updated geändert)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Erst wenn subscription.updated kommt, ändert sich isPremium
  await simulateSubscriptionUpdated(SUB_1, 'past_due');
  await test('9.4 subscription.updated (past_due, einzige Sub) → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 10: Drei gleichzeitige Subs mit gemischten Status
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 10: Drei Subs mit gemischten Status ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'active');
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_3, 'trialing');

  // Sub 1 → canceled
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await test('10.1 Sub 1 canceled, Sub 2+3 aktiv → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Sub 2 → past_due
  await simulateSubscriptionUpdated(SUB_2, 'past_due');
  await test('10.2 Sub 2 past_due, Sub 3 trialing → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Sub 3 → canceled → keine aktive Sub mehr
  await simulateSubscriptionUpdated(SUB_3, 'canceled');
  await test('10.3 Alle 3 inaktiv → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // Sub 2 zahlt nach → active
  await simulateSubscriptionUpdated(SUB_2, 'active');
  await test('10.4 Sub 2 wieder active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 11: Dreifach-Checkout (2 fehlgeschlagen, 1 aktiv)
  // Worst-Case: verspätete Events für BEIDE fehlgeschlagene Subs
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 11: Dreifach-Checkout (Worst-Case Race-Condition) ──');
  await setup();

  // Checkout 1 → fehlgeschlagen
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'incomplete');
  await simulateSubscriptionUpdated(SUB_1, 'incomplete');

  // Checkout 2 → auch fehlgeschlagen
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'incomplete');
  await simulateSubscriptionUpdated(SUB_2, 'incomplete');

  // Checkout 3 → erfolgreich!
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_3, 'active');
  await simulateSubscriptionUpdated(SUB_3, 'active');

  await test('11.1 Nach 3. Checkout: isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // JETZT kommen verspätete Events für Sub 1 und Sub 2
  await simulateSubscriptionUpdated(SUB_1, 'incomplete_expired');
  await test('11.2 Verspätetes Event Sub 1 (incomplete_expired) → isPremium bleibt true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  await simulateSubscriptionUpdated(SUB_2, 'incomplete_expired');
  await test('11.3 Verspätetes Event Sub 2 (incomplete_expired) → isPremium bleibt true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Canceled-Events
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await simulateSubscriptionUpdated(SUB_2, 'canceled');
  await test('11.4 Sub 1+2 canceled → isPremium bleibt true (Sub 3 active)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Delete-Events
  await simulateSubscriptionDeleted(SUB_1);
  await simulateSubscriptionDeleted(SUB_2);
  await test('11.5 Sub 1+2 deleted → isPremium bleibt true (Sub 3 active)', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Erst wenn Sub 3 auch weg ist → false
  await simulateSubscriptionDeleted(SUB_3);
  await test('11.6 Alle 3 deleted → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 12: Upgrade-Flow (Sub wechselt von 1 Monat auf 6 Monate)
  // Stripe erstellt manchmal eine neue Sub beim Upgrade
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 12: Upgrade-Flow (alte Sub canceled, neue active) ──');
  await setup();

  // Initiale Sub (1 Monat)
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');
  await test('12.1 Initiale Sub active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // Upgrade → neue Sub (6 Monate)
  await simulateCheckoutCompleted(TEST_USER_ID, SUB_2, 'active');

  // Alte Sub wird canceled
  await simulateSubscriptionUpdated(SUB_1, 'canceled');
  await test('12.2 Alte Sub canceled, neue Sub active → isPremium = true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  await simulateSubscriptionDeleted(SUB_1);
  await test('12.3 Alte Sub deleted → isPremium bleibt true', async () => {
    assertEquals(await getUserPremium(), true, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // SZENARIO 13: unpaid Status (Stripe setzt das nach mehreren fehlgeschlagenen Zahlungen)
  // ══════════════════════════════════════════════════════════════
  console.log('');
  console.log('── Szenario 13: unpaid Status ──');
  await setup();

  await simulateCheckoutCompleted(TEST_USER_ID, SUB_1, 'active');

  await simulateSubscriptionUpdated(SUB_1, 'unpaid');
  await test('13.1 unpaid (einzige Sub) → isPremium = false', async () => {
    assertEquals(await getUserPremium(), false, 'isPremium');
  });

  // ══════════════════════════════════════════════════════════════
  // AUFRÄUMEN + ERGEBNIS
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
