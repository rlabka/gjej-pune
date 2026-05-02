import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { fixEmailTypos, isDeliverableEmail } from '../services/email.service';

const router = Router();

/**
 * POST /api/contact
 * Public – sends a contact form submission via email.
 * Body: { name, email, subject, message, phone? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, subject, message, phone } = req.body;
    let { email } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'name, email and message are required' });
    }

    // Fix common typos and validate email domain
    email = fixEmailTypos(email.trim().toLowerCase());
    const deliverable = await isDeliverableEmail(email);
    if (!deliverable) {
      return res.status(400).json({ ok: false, error: 'invalidEmail' });
    }

    // Get SMTP settings
    const settings = await prisma.emailSettings.findUnique({ where: { id: 'default' } });
    if (!settings || !settings.smtpHost || !settings.smtpUser) {
      console.warn('[Contact] SMTP not configured, storing contact request only');
      return res.json({ ok: true, message: 'Nachricht empfangen (E-Mail-Versand nicht konfiguriert).' });
    }

    // Send contact email to admin
    const { sendContactEmail } = await import('../services/email.service');
    const sent = await sendContactEmail(name, email, subject || 'Kontaktanfrage', message, phone);

    if (sent) {
      res.json({ ok: true, message: 'Nachricht wurde erfolgreich gesendet.' });
    } else {
      res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden.' });
    }
  } catch (err) {
    console.error('[Contact] Error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
});

export default router;
