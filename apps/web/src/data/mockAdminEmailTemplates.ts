/**
 * Mock data layer for Admin Email Templates management.
 * In-memory store only. Replace with API calls when backend is ready.
 */

export type EmailTemplateId = 'registration' | 'premium_activation' | 'hidden_message_notification';

export type EmailTemplate = {
  id: EmailTemplateId;
  subject: string;
  bodyHtml: string;
  updatedAt: string; // ISO
};

// In-memory store (re-initialized on module load / refresh)
let store: EmailTemplate[] = [
  {
    id: 'registration',
    subject: 'Welcome to gjej-pune.com!',
    bodyHtml: '<h1>Welcome!</h1><p>Thank you for registering with gjej-pune.com. We\'re excited to help you find your dream job.</p>',
    updatedAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'premium_activation',
    subject: 'Your Premium Account is Now Active',
    bodyHtml: '<h1>Premium Activated</h1><p>Your premium subscription is now active. Enjoy exclusive features!</p>',
    updatedAt: '2025-01-20T14:30:00Z'
  },
  {
    id: 'hidden_message_notification',
    subject: 'You have a new message',
    bodyHtml: '<h1>New Message</h1><p>You have received a new message from an employer. Check your dashboard to view it.</p>',
    updatedAt: '2025-01-25T09:15:00Z'
  }
];

function cloneStore(): EmailTemplate[] {
  return store.map((t) => ({ ...t }));
}

/** Get all email templates. Returns a copy so UI cannot mutate the store. */
export function getEmailTemplates(): EmailTemplate[] {
  return cloneStore();
}

/** Update an email template. */
export function updateEmailTemplate(id: EmailTemplateId, subject: string, bodyHtml: string): void {
  const i = store.findIndex((t) => t.id === id);
  if (i === -1) return;
  store[i] = {
    ...store[i],
    subject,
    bodyHtml,
    updatedAt: new Date().toISOString()
  };
}

/** Get a single email template by ID. */
export function getEmailTemplate(id: EmailTemplateId): EmailTemplate | undefined {
  return store.find((t) => t.id === id);
}
