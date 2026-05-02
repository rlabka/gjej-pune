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
