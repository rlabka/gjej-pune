import { prisma } from '../config/prisma';
import { isUserOnline, getLastSeen } from '../websocket';

// ─── Get or Create Conversation ─────────────────────────

export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  jobId?: string,
  jobTitle?: string
) {
  // Normalise order so unique constraint works both ways
  const [p1, p2] = [userId1, userId2].sort();

  let conv = await prisma.conversation.findUnique({
    where: { participant1_participant2: { participant1: p1, participant2: p2 } },
  });

  if (!conv) {
    const jobRefs = jobId && jobTitle ? JSON.stringify([{ jobId, jobTitle }]) : '[]';
    conv = await prisma.conversation.create({
      data: {
        participant1: p1,
        participant2: p2,
        jobId: jobId || null,
        jobTitle: jobTitle || null,
        jobRefs,
        createdBy: userId1,
      },
    });
  } else {
    // Recover legacy/unowned empty conversations: if nobody has written yet
    // and createdBy is unset, claim it for the current caller so they keep
    // seeing it in their inbox after the recipient-side filter.
    if (!conv.createdBy && conv.lastMessage === null) {
      conv = await prisma.conversation.update({
        where: { id: conv.id },
        data: { createdBy: userId1 },
      });
    }
    if (jobId && jobTitle) {
      // Add new job reference if not already present
      let refs: { jobId: string; jobTitle: string }[] = [];
      try { refs = JSON.parse(conv.jobRefs || '[]'); } catch { refs = []; }
      if (!refs.some(r => r.jobId === jobId)) {
        refs.push({ jobId, jobTitle });
        conv = await prisma.conversation.update({
          where: { id: conv.id },
          data: { jobRefs: JSON.stringify(refs) },
        });
      }
    }
  }

  return conv;
}

// ─── Get All Conversations for a User ───────────────────

export async function getConversations(userId: string, isPremium: boolean = false) {
  // Hide empty conversations from the recipient. The sender (creator) still
  // sees their freshly-created conv so they can write the first message;
  // legacy rows without `createdBy` are gated purely on having a message.
  const convs = await prisma.conversation.findMany({
    where: {
      AND: [
        { OR: [{ participant1: userId }, { participant2: userId }] },
        {
          OR: [
            { lastMessage: { not: null } },
            { createdBy: userId },
          ],
        },
      ],
    },
    orderBy: { lastAt: 'desc' },
  });

  // Enrich with partner info + unread count
  const enriched = await Promise.all(
    convs.map(async (conv) => {
      const partnerId = conv.participant1 === userId ? conv.participant2 : conv.participant1;
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, displayName: true, image: true, role: true },
      });

      const unreadCount = await prisma.message.count({
        where: { conversationId: conv.id, read: false, senderId: { not: userId } },
      });

      // For non-premium: hide lastMessage if it was from partner
      let lastMessage = conv.lastMessage;
      if (!isPremium && lastMessage) {
        const lastMsg = await prisma.message.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: 'desc' },
          select: { senderId: true },
        });
        if (lastMsg && lastMsg.senderId !== userId) {
          lastMessage = '🔒';
        }
      }

      // Determine last seen: websocket > last message sent > updatedAt
      let partnerLastSeen: string | null = null;
      if (!isUserOnline(partnerId)) {
        const wsLastSeen = getLastSeen(partnerId);
        if (wsLastSeen) {
          partnerLastSeen = wsLastSeen.toISOString();
        } else {
          // Fallback: last message sent by partner in this conversation
          const lastPartnerMsg = await prisma.message.findFirst({
            where: { conversationId: conv.id, senderId: partnerId },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          });
          if (lastPartnerMsg) {
            partnerLastSeen = lastPartnerMsg.createdAt.toISOString();
          } else if (partner) {
            // Fallback: user's updatedAt
            const u = await prisma.user.findUnique({ where: { id: partnerId }, select: { updatedAt: true } });
            if (u) partnerLastSeen = u.updatedAt.toISOString();
          }
        }
      }

      return {
        id: conv.id,
        partnerId,
        partnerName: partner?.displayName || 'User',
        partnerImage: partner?.image || null,
        partnerRole: partner?.role || 'job-seeker',
        partnerOnline: isUserOnline(partnerId),
        partnerLastSeen,
        jobId: conv.jobId,
        jobTitle: conv.jobTitle,
        jobRefs: (() => { try { return JSON.parse(conv.jobRefs || '[]'); } catch { return []; } })(),
        lastMessage,
        lastAt: conv.lastAt,
        unreadCount,
        createdAt: conv.createdAt,
      };
    })
  );

  return enriched;
}

// ─── Get Messages of a Conversation ─────────────────────

function getPreviewLength(text: string | null): number {
  const len = text?.length || 0;
  if (len < 4) return len; // too short to hide
  if (len <= 20) return Math.ceil(len * 0.6);
  if (len <= 80) return Math.ceil(len * 0.4);
  return 30; // fixed cap for long messages
}

export async function getMessages(conversationId: string, userId: string, isPremium: boolean = false) {
  // Verify user is participant
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.participant1 !== userId && conv.participant2 !== userId)) {
    return null; // not authorized
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  // For non-premium users: show preview of received messages (truncated text)
  if (!isPremium) {
    return messages.map((msg) => {
      if (msg.senderId === userId) return { ...msg, isPreview: false };
      const len = msg.text?.length || 0;
      if (len < 4) return { ...msg, isPreview: false }; // too short to hide
      const previewLen = getPreviewLength(msg.text);
      const previewText = msg.text && len > previewLen
        ? msg.text.substring(0, previewLen) + '\u2026'
        : msg.text;
      return {
        ...msg,
        text: previewText,
        fileUrl: null,
        fileName: null,
        fileType: null,
        isPreview: true,
      };
    });
  }

  return messages.map((msg) => ({ ...msg, isPreview: false }));
}

// ─── Send Message ───────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  file?: { fileUrl: string; fileName: string; fileType: string }
) {
  // Verify sender is participant
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || (conv.participant1 !== senderId && conv.participant2 !== senderId)) {
    return null;
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      text,
      fileUrl: file?.fileUrl || null,
      fileName: file?.fileName || null,
      fileType: file?.fileType || null,
    },
  });

  // Update conversation's lastMessage + lastAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: text || (file ? `📎 ${file.fileName}` : ''), lastAt: new Date() },
  });

  // Send email notification to recipient only if OFFLINE (async, don't block)
  const recipientId = conv.participant1 === senderId ? conv.participant2 : conv.participant1;

  // Push notification to mobile devices (fire-and-forget, also when online — OS handles display)
  (async () => {
    try {
      const settings = await prisma.userSettings.findUnique({ where: { userId: recipientId } });
      if (settings && !settings.newMessageAlerts) return;

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { locale: true },
      });
      const { sendPushToUser } = await import('./push.service');
      // Privacy: do NOT include sender name or message preview — non-premium
      // users would otherwise read full chat content via OS push without ever
      // unlocking premium. Title + body are generic, localized to the
      // recipient's stored locale.
      const titleByLocale: Record<string, string> = {
        sq: 'Mesazh i ri',
        de: 'Neue Nachricht',
        en: 'New message',
        fr: 'Nouveau message',
        it: 'Nuovo messaggio',
      };
      const bodyByLocale: Record<string, string> = {
        sq: 'Ke marrë një mesazh të ri.',
        de: 'Du hast eine neue Nachricht erhalten.',
        en: 'You have received a new message.',
        fr: 'Vous avez reçu un nouveau message.',
        it: 'Hai ricevuto un nuovo messaggio.',
      };
      const loc = recipient?.locale && titleByLocale[recipient.locale] ? recipient.locale : 'sq';
      await sendPushToUser(
        recipientId,
        titleByLocale[loc],
        bodyByLocale[loc],
        { type: 'message', conversationId, messageId: message.id }
      );
    } catch (err) {
      console.error('[Message] Failed to send push notification:', err);
    }
  })();

  (async () => {
    try {
      // Skip email if recipient is currently online (they see messages in real-time)
      if (isUserOnline(recipientId)) return;

      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { email: true, displayName: true, locale: true, settings: true },
      });
      if (!recipient) return;

      // Check if user has message alerts enabled
      const settings = await prisma.userSettings.findUnique({ where: { userId: recipientId } });
      if (settings && !settings.newMessageAlerts) return;

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { displayName: true },
      });

      const { sendNewMessageNotification } = await import('./email.service');
      await sendNewMessageNotification(
        recipient.email,
        recipient.displayName || 'User',
        sender?.displayName || 'Someone',
        text || (file ? `📎 ${file.fileName}` : ''),
        (recipient as any).locale
      );
    } catch (err) {
      console.error('[Message] Failed to send notification email:', err);
    }
  })();

  return message;
}

// ─── Mark Messages as Read ──────────────────────────────

export async function markAsRead(conversationId: string, userId: string) {
  // Mark all messages from the OTHER user as read
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, read: false },
    data: { read: true },
  });
}

// ─── Get Total Unread Count ─────────────────────────────

export async function getUnreadCount(userId: string) {
  // Find all conversations where user is participant
  const convs = await prisma.conversation.findMany({
    where: { OR: [{ participant1: userId }, { participant2: userId }] },
    select: { id: true },
  });

  if (convs.length === 0) return 0;

  const count = await prisma.message.count({
    where: {
      conversationId: { in: convs.map((c) => c.id) },
      senderId: { not: userId },
      read: false,
    },
  });

  return count;
}
