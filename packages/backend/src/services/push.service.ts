import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '../config/prisma';

const expo = new Expo();

function parseTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Store an Expo push token for the given user. Tokens are deduped.
 * Returns the updated list.
 */
export async function registerPushToken(userId: string, token: string): Promise<string[]> {
  if (!Expo.isExpoPushToken(token)) {
    throw new Error('invalidToken');
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });
  if (!user) throw new Error('userNotFound');

  const tokens = parseTokens(user.pushTokens);
  if (!tokens.includes(token)) tokens.push(token);

  await prisma.user.update({
    where: { id: userId },
    data: { pushTokens: JSON.stringify(tokens) },
  });
  return tokens;
}

export async function unregisterPushToken(userId: string, token: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });
  if (!user) return [];

  const tokens = parseTokens(user.pushTokens).filter((t) => t !== token);
  await prisma.user.update({
    where: { id: userId },
    data: { pushTokens: JSON.stringify(tokens) },
  });
  return tokens;
}

/**
 * Remove any tokens that Expo has marked as invalid (DeviceNotRegistered).
 */
async function pruneInvalidTokens(userId: string, invalid: Set<string>) {
  if (invalid.size === 0) return;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });
  if (!user) return;
  const remaining = parseTokens(user.pushTokens).filter((t) => !invalid.has(t));
  await prisma.user.update({
    where: { id: userId },
    data: { pushTokens: JSON.stringify(remaining) },
  });
}

/**
 * Audience filter for the admin broadcast. Every field is optional and AND'd
 * together. Empty filter (`{}`) matches every user that has at least one
 * registered push token.
 */
export type BroadcastFilter = {
  role?: 'job-seeker' | 'employer';
  isPremium?: boolean;
  locale?: string;
  countryCode?: string;
};

/**
 * Resolve a BroadcastFilter to the set of users who would receive a push
 * (i.e. have at least one Expo push token registered).
 */
async function resolveAudience(filter: BroadcastFilter): Promise<
  { id: string; pushTokens: string }[]
> {
  const where: Record<string, unknown> = {
    pushTokens: { not: '[]' },
  };
  if (filter.role) where.role = filter.role;
  if (typeof filter.isPremium === 'boolean') where.isPremium = filter.isPremium;
  if (filter.locale) where.locale = filter.locale;
  // countryCode lives on JobSeekerAd/Job, not User — filter via subquery so the
  // broadcast can target users from a specific country anyway.
  if (filter.countryCode) {
    where.OR = [
      { jobSeekerAds: { some: { countryCode: filter.countryCode } } },
      { jobs: { some: { countryCode: filter.countryCode } } },
    ];
  }
  return prisma.user.findMany({
    where: where as never,
    select: { id: true, pushTokens: true },
  });
}

/**
 * Count how many users a given filter would reach. Used by the admin UI for
 * a "will be delivered to X users" preview before sending.
 */
export async function previewBroadcastAudience(
  filter: BroadcastFilter
): Promise<{ users: number; devices: number }> {
  const audience = await resolveAudience(filter);
  let devices = 0;
  for (const u of audience) devices += parseTokens(u.pushTokens).length;
  return { users: audience.length, devices };
}

/**
 * Send a broadcast push to every user matching the filter. Chunks across
 * Expo's batch limit, prunes invalid tokens, never throws.
 */
export async function broadcastPush(
  filter: BroadcastFilter,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<{ users: number; devices: number; sent: number; failed: number }> {
  const audience = await resolveAudience(filter);

  // Flatten to (userId, token) pairs so we can prune invalid tokens per user.
  const pairs: { userId: string; token: string }[] = [];
  for (const u of audience) {
    for (const t of parseTokens(u.pushTokens)) {
      if (Expo.isExpoPushToken(t)) pairs.push({ userId: u.id, token: t });
    }
  }
  if (pairs.length === 0) {
    return { users: audience.length, devices: 0, sent: 0, failed: 0 };
  }

  const messages: ExpoPushMessage[] = pairs.map(({ token }) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'announcements',
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;
  const invalidByUser = new Map<string, Set<string>>();

  let cursor = 0;
  for (const chunk of chunks) {
    try {
      const received = await expo.sendPushNotificationsAsync(chunk);
      received.forEach((ticket, idx) => {
        const { userId, token } = pairs[cursor + idx];
        if (ticket.status === 'ok') {
          sent++;
        } else {
          failed++;
          if (ticket.details?.error === 'DeviceNotRegistered') {
            if (!invalidByUser.has(userId)) invalidByUser.set(userId, new Set());
            invalidByUser.get(userId)!.add(token);
          }
        }
      });
    } catch (err) {
      console.error('[Push] broadcast chunk failed:', err);
      failed += chunk.length;
    }
    cursor += chunk.length;
  }

  for (const [userId, tokens] of invalidByUser) {
    await pruneInvalidTokens(userId, tokens);
  }

  return { users: audience.length, devices: pairs.length, sent, failed };
}

/**
 * Send a push notification to all devices of a user. Safe to call — logs errors,
 * never throws. Returns the tickets for diagnostic purposes.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<ExpoPushTicket[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushTokens: true },
    });
    if (!user) return [];

    const tokens = parseTokens(user.pushTokens).filter((t) => Expo.isExpoPushToken(t));
    if (tokens.length === 0) return [];

    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'messages',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    const invalid = new Set<string>();

    for (const chunk of chunks) {
      try {
        const received = await expo.sendPushNotificationsAsync(chunk);
        received.forEach((ticket, idx) => {
          tickets.push(ticket);
          if (
            ticket.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            invalid.add(chunk[idx].to as string);
          }
        });
      } catch (err) {
        console.error('[Push] chunk send failed:', err);
      }
    }

    await pruneInvalidTokens(userId, invalid);
    return tickets;
  } catch (err) {
    console.error('[Push] sendPushToUser failed:', err);
    return [];
  }
}
