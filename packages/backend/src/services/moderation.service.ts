import { prisma } from '../config/prisma';

/**
 * UGC moderation service — App Store Review Guideline 1.2.
 *
 * Block semantics: a one-way DB record (blocker -> blocked), but every
 * read filter applies symmetrically (UNION of "I blocked X" and "X blocked
 * me"), so once either party blocks, neither sees the other anywhere.
 */

const VALID_TARGET_TYPES = ['user', 'message', 'job', 'ad'] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];

const VALID_REASONS = [
  'spam',
  'harassment',
  'inappropriate',
  'fake',
  'other',
] as const;
type Reason = (typeof VALID_REASONS)[number];

export async function blockUser(blockerId: string, blockedId: string): Promise<{ ok: true } | { ok: false; code: string }> {
  if (blockerId === blockedId) return { ok: false, code: 'cannotBlockSelf' };

  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) return { ok: false, code: 'userNotFound' };

  // Idempotent: ignore unique-constraint violation if block already exists.
  await prisma.userBlock
    .create({ data: { blockerId, blockedId } })
    .catch(() => undefined);

  return { ok: true };
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<{ ok: true }> {
  await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  return { ok: true };
}

export async function listBlockedUsers(blockerId: string) {
  const rows = await prisma.userBlock.findMany({
    where: { blockerId },
    orderBy: { createdAt: 'desc' },
    include: {
      blocked: {
        select: {
          id: true,
          email: true,
          displayName: true,
          image: true,
          role: true,
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    blockedAt: r.createdAt.toISOString(),
    user: r.blocked,
  }));
}

/**
 * Returns the set of user IDs that should be invisible to `userId`:
 * users whom they have blocked, plus users who have blocked them.
 * Cached per request would be ideal — for now we query each call.
 */
export async function getHiddenUserIds(userId: string): Promise<string[]> {
  const [blocking, blockedBy] = await Promise.all([
    prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.userBlock.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);
  const set = new Set<string>();
  for (const r of blocking) set.add(r.blockedId);
  for (const r of blockedBy) set.add(r.blockerId);
  return Array.from(set);
}

export async function isHiddenBetween(userA: string, userB: string): Promise<boolean> {
  if (userA === userB) return false;
  const row = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

export interface CreateReportInput {
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
}

export async function createReport(
  input: CreateReportInput
): Promise<{ ok: true; id: string } | { ok: false; code: string }> {
  const { reporterId, targetType, targetId, reason, details } = input;

  if (!VALID_TARGET_TYPES.includes(targetType as TargetType)) {
    return { ok: false, code: 'invalidTargetType' };
  }
  if (!VALID_REASONS.includes(reason as Reason)) {
    return { ok: false, code: 'invalidReason' };
  }
  if (!targetId || typeof targetId !== 'string') {
    return { ok: false, code: 'missingTargetId' };
  }
  if (details && details.length > 2000) {
    return { ok: false, code: 'detailsTooLong' };
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetType,
      targetId,
      reason,
      details: details?.trim() || null,
      status: 'pending',
    },
    select: { id: true },
  });

  return { ok: true, id: report.id };
}
