import { prisma } from '../config/prisma';
import { emitToUser } from '../websocket';

// ─── Create Notification ─────────────────────────────────
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  meta: Record<string, unknown> = {}
) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, meta: JSON.stringify(meta) },
  });

  // Emit real-time event to user
  emitToUser(userId, 'notification:new', notification);

  return notification;
}

// ─── Get Notifications (paginated) ───────────────────────
export async function getNotifications(userId: string, limit = 15, cursor?: string) {
  const query: any = {
    where: { userId },
    orderBy: { createdAt: 'desc' as const },
    take: limit + 1, // fetch one extra to know if there's a next page
  };
  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1; // skip the cursor itself
  }
  const items = await prisma.notification.findMany(query);
  const hasMore = items.length > limit;
  const notifications = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? notifications[notifications.length - 1].id : null;
  return { notifications, nextCursor };
}

// ─── Unread Count ────────────────────────────────────────
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

// ─── Mark as Read ────────────────────────────────────────
export async function markAsRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

// ─── Mark All as Read ────────────────────────────────────
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
