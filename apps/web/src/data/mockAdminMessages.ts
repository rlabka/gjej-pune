/**
 * Mock data layer for Admin Messages management.
 * In-memory store only. Replace with API calls when backend is ready.
 */

export type MessageSenderType = 'job-seeker' | 'employer';

export type MessageStatus = 'active' | 'deleted' | 'blocked' | 'archived';

export type AdminMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderType: MessageSenderType;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientType: MessageSenderType;
  content: string;
  sentAt: string; // ISO
  status: MessageStatus;
  isReported: boolean;
  reportReason?: string;
  reportedAt?: string; // ISO
};

export type MessageConversation = {
  id: string;
  participant1Id: string;
  participant1Name: string;
  participant1Email: string;
  participant1Type: MessageSenderType;
  participant2Id: string;
  participant2Name: string;
  participant2Email: string;
  participant2Type: MessageSenderType;
  lastMessageAt: string; // ISO
  messageCount: number;
  status: MessageStatus;
};

// In-memory store for messages
let messagesStore: AdminMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'js-1',
    senderName: 'Sarah Keller',
    senderEmail: 'sarah.k@example.com',
    senderType: 'job-seeker',
    recipientId: 'emp-1',
    recipientName: 'Tech Solutions GmbH',
    recipientEmail: 'hr@techsolutions.de',
    recipientType: 'employer',
    content: 'Hello! I reviewed your profile and I am impressed with your experience.',
    sentAt: '2025-02-01T10:15:00Z',
    status: 'active',
    isReported: false
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'emp-1',
    senderName: 'Tech Solutions GmbH',
    senderEmail: 'hr@techsolutions.de',
    senderType: 'employer',
    recipientId: 'js-1',
    recipientName: 'Sarah Keller',
    recipientEmail: 'sarah.k@example.com',
    recipientType: 'job-seeker',
    content: 'Thank you! I am very interested in the Senior UX Designer position.',
    sentAt: '2025-02-01T10:20:00Z',
    status: 'active',
    isReported: false
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'emp-1',
    senderName: 'Tech Solutions GmbH',
    senderEmail: 'hr@techsolutions.de',
    senderType: 'employer',
    recipientId: 'js-1',
    recipientName: 'Sarah Keller',
    recipientEmail: 'sarah.k@example.com',
    recipientType: 'job-seeker',
    content: 'Great. When can we schedule a quick call to discuss the next steps?',
    sentAt: '2025-02-01T10:25:00Z',
    status: 'active',
    isReported: false
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'js-2',
    senderName: 'Marc Berner',
    senderEmail: 'marc.berner@example.com',
    senderType: 'job-seeker',
    recipientId: 'emp-2',
    recipientName: 'Innovation Labs',
    recipientEmail: 'hr@innovationlabs.com',
    recipientType: 'employer',
    content: 'I have reviewed the job requirements and I believe I am a great fit.',
    sentAt: '2025-01-31T11:30:00Z',
    status: 'active',
    isReported: false
  },
  {
    id: 'msg-5',
    conversationId: 'conv-3',
    senderId: 'emp-3',
    senderName: 'Green Energy Co',
    senderEmail: 'recruit@greenenergy.ch',
    senderType: 'employer',
    recipientId: 'js-3',
    recipientName: 'Lisa Müller',
    recipientEmail: 'lisa.mueller@example.com',
    recipientType: 'job-seeker',
    content: 'This is inappropriate content that should be reported.',
    sentAt: '2025-01-30T14:00:00Z',
    status: 'active',
    isReported: true,
    reportReason: 'Inappropriate language',
    reportedAt: '2025-01-30T14:30:00Z'
  },
  {
    id: 'msg-6',
    conversationId: 'conv-4',
    senderId: 'js-4',
    senderName: 'Pierre Dubois',
    senderEmail: 'pierre.dubois@example.com',
    senderType: 'job-seeker',
    recipientId: 'emp-4',
    recipientName: 'FinanceHub SA',
    recipientEmail: 'talent@financehub.ch',
    recipientType: 'employer',
    content: 'Thank you for the opportunity. I am looking forward to hearing from you.',
    sentAt: '2025-01-29T16:00:00Z',
    status: 'deleted',
    isReported: false
  },
  {
    id: 'msg-7',
    conversationId: 'conv-5',
    senderId: 'emp-5',
    senderName: 'Swiss Digital Labs',
    senderEmail: 'careers@swissdigital.ch',
    senderType: 'employer',
    recipientId: 'js-5',
    recipientName: 'David Chen',
    recipientEmail: 'david.chen@example.com',
    recipientType: 'job-seeker',
    content: 'We reviewed your application and would like to proceed.',
    sentAt: '2025-01-28T09:00:00Z',
    status: 'archived',
    isReported: false
  }
];

// In-memory store for conversations
let conversationsStore: MessageConversation[] = [
  {
    id: 'conv-1',
    participant1Id: 'js-1',
    participant1Name: 'Sarah Keller',
    participant1Email: 'sarah.k@example.com',
    participant1Type: 'job-seeker',
    participant2Id: 'emp-1',
    participant2Name: 'Tech Solutions GmbH',
    participant2Email: 'hr@techsolutions.de',
    participant2Type: 'employer',
    lastMessageAt: '2025-02-01T10:25:00Z',
    messageCount: 3,
    status: 'active'
  },
  {
    id: 'conv-2',
    participant1Id: 'js-2',
    participant1Name: 'Marc Berner',
    participant1Email: 'marc.berner@example.com',
    participant1Type: 'job-seeker',
    participant2Id: 'emp-2',
    participant2Name: 'Innovation Labs',
    participant2Email: 'hr@innovationlabs.com',
    participant2Type: 'employer',
    lastMessageAt: '2025-01-31T11:30:00Z',
    messageCount: 1,
    status: 'active'
  },
  {
    id: 'conv-3',
    participant1Id: 'emp-3',
    participant1Name: 'Green Energy Co',
    participant1Email: 'recruit@greenenergy.ch',
    participant1Type: 'employer',
    participant2Id: 'js-3',
    participant2Name: 'Lisa Müller',
    participant2Email: 'lisa.mueller@example.com',
    participant2Type: 'job-seeker',
    lastMessageAt: '2025-01-30T14:00:00Z',
    messageCount: 1,
    status: 'active'
  },
  {
    id: 'conv-4',
    participant1Id: 'js-4',
    participant1Name: 'Pierre Dubois',
    participant1Email: 'pierre.dubois@example.com',
    participant1Type: 'job-seeker',
    participant2Id: 'emp-4',
    participant2Name: 'FinanceHub SA',
    participant2Email: 'talent@financehub.ch',
    participant2Type: 'employer',
    lastMessageAt: '2025-01-29T16:00:00Z',
    messageCount: 1,
    status: 'active'
  },
  {
    id: 'conv-5',
    participant1Id: 'emp-5',
    participant1Name: 'Swiss Digital Labs',
    participant1Email: 'careers@swissdigital.ch',
    participant1Type: 'employer',
    participant2Id: 'js-5',
    participant2Name: 'David Chen',
    participant2Email: 'david.chen@example.com',
    participant2Type: 'job-seeker',
    lastMessageAt: '2025-01-28T09:00:00Z',
    messageCount: 1,
    status: 'active'
  }
];

function cloneMessages(): AdminMessage[] {
  return messagesStore.map((m) => ({ ...m }));
}

function cloneConversations(): MessageConversation[] {
  return conversationsStore.map((c) => ({ ...c }));
}

/** Get all messages with optional filters. Returns a copy so UI cannot mutate the store. */
export function getAdminMessages(filters?: {
  status?: MessageStatus;
  senderType?: MessageSenderType;
  isReported?: boolean;
  conversationId?: string;
}): AdminMessage[] {
  let result = cloneMessages();
  
  if (filters?.status) {
    result = result.filter((m) => m.status === filters.status);
  }
  
  if (filters?.senderType) {
    result = result.filter((m) => m.senderType === filters.senderType);
  }
  
  if (filters?.isReported !== undefined) {
    result = result.filter((m) => m.isReported === filters.isReported);
  }
  
  if (filters?.conversationId) {
    result = result.filter((m) => m.conversationId === filters.conversationId);
  }
  
  return result.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

/** Get all conversations. Returns a copy so UI cannot mutate the store. */
export function getAdminConversations(filters?: {
  status?: MessageStatus;
  participantType?: MessageSenderType;
}): MessageConversation[] {
  let result = cloneConversations();
  
  if (filters?.status) {
    result = result.filter((c) => c.status === filters.status);
  }
  
  if (filters?.participantType) {
    result = result.filter((c) => 
      c.participant1Type === filters.participantType || 
      c.participant2Type === filters.participantType
    );
  }
  
  return result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

/** Delete a message (soft delete). */
export function deleteMessage(messageId: string): void {
  const i = messagesStore.findIndex((m) => m.id === messageId);
  if (i === -1) return;
  messagesStore[i] = { ...messagesStore[i], status: 'deleted' };
}

/** Permanently delete a message. */
export function permanentlyDeleteMessage(messageId: string): void {
  messagesStore = messagesStore.filter((m) => m.id !== messageId);
}

/** Block a message. */
export function blockMessage(messageId: string): void {
  const i = messagesStore.findIndex((m) => m.id === messageId);
  if (i === -1) return;
  messagesStore[i] = { ...messagesStore[i], status: 'blocked' };
}

/** Unblock a message. */
export function unblockMessage(messageId: string): void {
  const i = messagesStore.findIndex((m) => m.id === messageId);
  if (i === -1) return;
  messagesStore[i] = { ...messagesStore[i], status: 'active' };
}

/** Archive a message. */
export function archiveMessage(messageId: string): void {
  const i = messagesStore.findIndex((m) => m.id === messageId);
  if (i === -1) return;
  messagesStore[i] = { ...messagesStore[i], status: 'archived' };
}

/** Unarchive a message. */
export function unarchiveMessage(messageId: string): void {
  const i = messagesStore.findIndex((m) => m.id === messageId);
  if (i === -1) return;
  messagesStore[i] = { ...messagesStore[i], status: 'active' };
}

/** Delete a conversation (soft delete). */
export function deleteConversation(conversationId: string): void {
  const i = conversationsStore.findIndex((c) => c.id === conversationId);
  if (i === -1) return;
  conversationsStore[i] = { ...conversationsStore[i], status: 'deleted' };
  // Also mark all messages in this conversation as deleted
  messagesStore = messagesStore.map((m) => 
    m.conversationId === conversationId ? { ...m, status: 'deleted' } : m
  );
}

/** Permanently delete a conversation and all its messages. */
export function permanentlyDeleteConversation(conversationId: string): void {
  conversationsStore = conversationsStore.filter((c) => c.id !== conversationId);
  messagesStore = messagesStore.filter((m) => m.conversationId !== conversationId);
}

/** Block a conversation. */
export function blockConversation(conversationId: string): void {
  const i = conversationsStore.findIndex((c) => c.id === conversationId);
  if (i === -1) return;
  conversationsStore[i] = { ...conversationsStore[i], status: 'blocked' };
  // Also block all messages in this conversation
  messagesStore = messagesStore.map((m) => 
    m.conversationId === conversationId ? { ...m, status: 'blocked' } : m
  );
}

/** Unblock a conversation. */
export function unblockConversation(conversationId: string): void {
  const i = conversationsStore.findIndex((c) => c.id === conversationId);
  if (i === -1) return;
  conversationsStore[i] = { ...conversationsStore[i], status: 'active' };
  // Also unblock all messages in this conversation
  messagesStore = messagesStore.map((m) => 
    m.conversationId === conversationId ? { ...m, status: 'active' } : m
  );
}

/** Archive a conversation. */
export function archiveConversation(conversationId: string): void {
  const i = conversationsStore.findIndex((c) => c.id === conversationId);
  if (i === -1) return;
  conversationsStore[i] = { ...conversationsStore[i], status: 'archived' };
  // Also archive all messages in this conversation
  messagesStore = messagesStore.map((m) => 
    m.conversationId === conversationId ? { ...m, status: 'archived' } : m
  );
}

/** Unarchive a conversation. */
export function unarchiveConversation(conversationId: string): void {
  const i = conversationsStore.findIndex((c) => c.id === conversationId);
  if (i === -1) return;
  conversationsStore[i] = { ...conversationsStore[i], status: 'active' };
  // Also unarchive all messages in this conversation
  messagesStore = messagesStore.map((m) => 
    m.conversationId === conversationId ? { ...m, status: 'active' } : m
  );
}

/** Get a single message by ID. */
export function getAdminMessage(messageId: string): AdminMessage | undefined {
  return messagesStore.find((m) => m.id === messageId);
}

/** Get a single conversation by ID. */
export function getAdminConversation(conversationId: string): MessageConversation | undefined {
  return conversationsStore.find((c) => c.id === conversationId);
}
