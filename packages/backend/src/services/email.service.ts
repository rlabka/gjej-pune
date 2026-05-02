import nodemailer from 'nodemailer';
import { promises as dns } from 'dns';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

// ─── Email Typo Corrections ────────────────────────────

const DOMAIN_TYPO_MAP: Record<string, string> = {
  // Gmail
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com',
  'gmail.cpm': 'gmail.com', 'gmail.vom': 'gmail.com', 'gmail.om': 'gmail.com',
  'gmail.cim': 'gmail.com', 'gmail.xom': 'gmail.com', 'gmail.dom': 'gmail.com',
  'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmil.com': 'gmail.com',
  'gail.com': 'gmail.com', 'gemail.com': 'gmail.com', 'gimail.com': 'gmail.com',
  // Hotmail
  'hotmail.con': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com', 'hotamil.com': 'hotmail.com', 'hotmaill.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com', 'homail.com': 'hotmail.com', 'htmail.com': 'hotmail.com',
  // Outlook
  'outlook.con': 'outlook.com', 'outloock.com': 'outlook.com', 'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com', 'outlool.com': 'outlook.com', 'outloo.com': 'outlook.com',
  // Yahoo
  'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com', 'yhoo.com': 'yahoo.com', 'yahho.com': 'yahoo.com',
  // iCloud
  'icloud.con': 'icloud.com', 'iclould.com': 'icloud.com', 'iclod.com': 'icloud.com',
  'icoud.com': 'icloud.com', 'icloud.co': 'icloud.com',
  // GMX (.com, .ch, .de, .at, .net)
  'gmx.con': 'gmx.com', 'gmx.ce': 'gmx.ch', 'gmx.cha': 'gmx.ch',
  'gmx.ed': 'gmx.de', 'gmx.dee': 'gmx.de', 'gmx.da': 'gmx.de',
  'gmx.ta': 'gmx.at', 'gmx.ant': 'gmx.net', 'gmx.ent': 'gmx.net',
  // Bluewin (Schweiz)
  'bluewin.ce': 'bluewin.ch', 'bluewin.con': 'bluewin.ch', 'bluewin.cj': 'bluewin.ch',
  'bluwin.ch': 'bluewin.ch', 'bluwein.ch': 'bluewin.ch', 'blewin.ch': 'bluewin.ch',
  // Protonmail
  'protonmail.con': 'protonmail.com', 'protonmal.com': 'protonmail.com',
  'protonmial.com': 'protonmail.com', 'protonmil.com': 'protonmail.com',
  'proton.em': 'proton.me', 'proton.mee': 'proton.me', 'proton.ne': 'proton.me',
  // Web.de (Deutschland)
  'web.ed': 'web.de', 'web.dee': 'web.de', 'web.da': 'web.de',
  // T-Online (Deutschland)
  't-online.ed': 't-online.de', 't-online.dee': 't-online.de',
  'tonline.de': 't-online.de', 't-onlline.de': 't-online.de',
  // Live / MSN
  'live.con': 'live.com', 'live.co': 'live.com', 'live.cm': 'live.com',
  'msn.con': 'msn.com', 'msn.co': 'msn.com',
  // Albanische / Kosovarische Anbieter
  'kujtesa.con': 'kujtesa.com', 'kujtesa.co': 'kujtesa.com', 'kujtesa.cm': 'kujtesa.com',
  'kujtsa.com': 'kujtesa.com', 'kujtessa.com': 'kujtesa.com', 'kujtes.com': 'kujtesa.com',
  'ipko.ent': 'ipko.net', 'ipko.nt': 'ipko.net', 'ipko.ne': 'ipko.net',
  'ikpo.net': 'ipko.net', 'ipk.net': 'ipko.net', 'ipo.net': 'ipko.net',
  'albmail.con': 'albmail.com', 'albmail.co': 'albmail.com',
  'albmal.com': 'albmail.com', 'albamail.com': 'albmail.com',
  'abcom.la': 'abcom.al', 'abcom.a': 'abcom.al', 'abcm.al': 'abcom.al',
  'albtelecom.la': 'albtelecom.al', 'albtelecom.a': 'albtelecom.al',
  'albtelcom.al': 'albtelecom.al', 'albtelekon.al': 'albtelecom.al',
  'abissnet.la': 'abissnet.al', 'abissnet.a': 'abissnet.al',
  'abisnet.al': 'abissnet.al', 'abissnt.al': 'abissnet.al',
  'yahoo.co': 'yahoo.com', 'yahoo.cm': 'yahoo.com',
  'hotmail.cm': 'hotmail.com', 'hotmail.om': 'hotmail.com',
};

export function fixEmailTypos(email: string): string {
  const lower = email.trim().toLowerCase();
  const [local, domain] = lower.split('@');
  if (!domain) return lower;
  const fixed = DOMAIN_TYPO_MAP[domain];
  return fixed ? `${local}@${fixed}` : lower;
}

// ─── DNS MX Check ──────────────────────────────────────

const mxCache = new Map<string, { valid: boolean; ts: number }>();
const MX_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function hasMxRecord(domain: string): Promise<boolean> {
  const cached = mxCache.get(domain);
  if (cached && Date.now() - cached.ts < MX_CACHE_TTL) return cached.valid;
  try {
    const records = await dns.resolveMx(domain);
    const valid = records.length > 0;
    mxCache.set(domain, { valid, ts: Date.now() });
    return valid;
  } catch {
    mxCache.set(domain, { valid: false, ts: Date.now() });
    return false;
  }
}

export async function isDeliverableEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return hasMxRecord(domain);
}

// ─── Get SMTP Settings from DB ──────────────────────────

async function getSmtpSettings() {
  let settings = await prisma.emailSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.emailSettings.create({ data: { id: 'default' } });
  }
  return settings;
}

// ─── HTML Escape (XSS prevention) ───────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Locale Type & Helpers ──────────────────────────────

type EmailLocale = 'de' | 'en' | 'fr' | 'it' | 'sq';

function validLocale(l?: string): EmailLocale {
  if (l && ['de','en','fr','it','sq'].includes(l)) return l as EmailLocale;
  return 'de';
}

// ─── Email Translations ────────────────────────────────

const i18n: Record<string, Record<EmailLocale, string>> = {
  allRights:      { de: 'Alle Rechte vorbehalten', en: 'All rights reserved', fr: 'Tous droits réservés', it: 'Tutti i diritti riservati', sq: 'Të gjitha të drejtat e rezervuara' },
  welcomeSubject: { de: 'Willkommen bei gjej-pune.com!', en: 'Welcome to gjej-pune.com!', fr: 'Bienvenue sur gjej-pune.com !', it: 'Benvenuto su gjej-pune.com!', sq: 'Mirësevini në gjej-pune.com!' },
  welcomeHello:   { de: 'Willkommen', en: 'Welcome', fr: 'Bienvenue', it: 'Benvenuto', sq: 'Mirësevini' },
  welcomeThank:   { de: 'Vielen Dank für Ihre Registrierung bei', en: 'Thank you for registering at', fr: 'Merci pour votre inscription sur', it: 'Grazie per esservi registrati su', sq: 'Faleminderit për regjistrimin tuaj në' },
  welcomeEmp:     { de: 'Sie können jetzt Stellenangebote veröffentlichen und die besten Kandidaten finden.', en: 'You can now post job listings and find the best candidates.', fr: 'Vous pouvez maintenant publier des offres d\'emploi et trouver les meilleurs candidats.', it: 'Ora potete pubblicare annunci di lavoro e trovare i migliori candidati.', sq: 'Tani mund të publikoni oferta pune dhe të gjeni kandidatët më të mirë.' },
  welcomeSeeker:  { de: 'Sie können jetzt Ihr Profil erstellen und die besten Stellenangebote entdecken.', en: 'You can now create your profile and discover the best job offers.', fr: 'Vous pouvez maintenant créer votre profil et découvrir les meilleures offres d\'emploi.', it: 'Ora potete creare il vostro profilo e scoprire le migliori offerte di lavoro.', sq: 'Tani mund të krijoni profilin tuaj dhe të zbuloni ofertat më të mira të punës.' },
  toDashboard:    { de: 'Zum Dashboard', en: 'Go to Dashboard', fr: 'Aller au tableau de bord', it: 'Vai alla dashboard', sq: 'Shko te paneli' },
  createProfile:  { de: 'Profil erstellen', en: 'Create profile', fr: 'Créer un profil', it: 'Crea profilo', sq: 'Krijo profilin' },
  questionsHelp:  { de: 'Bei Fragen stehen wir Ihnen gerne zur Verfügung.', en: 'If you have any questions, we are happy to help.', fr: 'Si vous avez des questions, nous sommes à votre disposition.', it: 'Per qualsiasi domanda, siamo a vostra disposizione.', sq: 'Nëse keni pyetje, jemi të gatshëm t\'ju ndihmojmë.' },
  resetSubject:   { de: 'Passwort zurücksetzen', en: 'Reset password', fr: 'Réinitialiser le mot de passe', it: 'Reimposta password', sq: 'Rivendos fjalëkalimin' },
  resetHello:     { de: 'Hallo', en: 'Hello', fr: 'Bonjour', it: 'Ciao', sq: 'Përshëndetje' },
  resetText:      { de: 'Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt. Klicken Sie auf den Button unten, um ein neues Passwort zu erstellen.', en: 'You have requested a password reset. Click the button below to create a new password.', fr: 'Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.', it: 'Hai richiesto il reset della password. Clicca il pulsante qui sotto per crearne una nuova.', sq: 'Keni kërkuar rivendosjen e fjalëkalimit. Klikoni butonin më poshtë për të krijuar një fjalëkalim të ri.' },
  resetBtn:       { de: 'Neues Passwort erstellen', en: 'Create new password', fr: 'Créer un nouveau mot de passe', it: 'Crea nuova password', sq: 'Krijo fjalëkalim të ri' },
  resetExpiry:    { de: 'Dieser Link ist <strong>1 Stunde</strong> gültig. Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.', en: 'This link is valid for <strong>1 hour</strong>. If you did not request this, you can ignore this email.', fr: 'Ce lien est valable <strong>1 heure</strong>. Si vous n\'avez pas fait cette demande, ignorez cet e-mail.', it: 'Questo link è valido per <strong>1 ora</strong>. Se non hai effettuato questa richiesta, puoi ignorare questa email.', sq: 'Ky link është i vlefshëm për <strong>1 orë</strong>. Nëse nuk e keni bërë këtë kërkesë, mund ta injoroni këtë email.' },
  resetFallback:  { de: 'Falls der Button nicht funktioniert, kopieren Sie diesen Link:', en: 'If the button does not work, copy this link:', fr: 'Si le bouton ne fonctionne pas, copiez ce lien :', it: 'Se il pulsante non funziona, copia questo link:', sq: 'Nëse butoni nuk funksionon, kopjoni këtë link:' },
  msgSubject:     { de: 'Neue Nachricht von', en: 'New message from', fr: 'Nouveau message de', it: 'Nuovo messaggio da', sq: 'Mesazh i ri nga' },
  msgTitle:       { de: 'Neue Nachricht erhalten', en: 'New message received', fr: 'Nouveau message reçu', it: 'Nuovo messaggio ricevuto', sq: 'Mesazh i ri i marrë' },
  msgSentYou:     { de: 'hat Ihnen eine neue Nachricht gesendet.', en: 'sent you a new message.', fr: 'vous a envoyé un nouveau message.', it: 'ti ha inviato un nuovo messaggio.', sq: 'ju ka dërguar një mesazh të ri.' },
  msgLoginToRead: { de: 'Melden Sie sich an, um die Nachricht zu lesen und zu antworten.', en: 'Log in to read and reply to the message.', fr: 'Connectez-vous pour lire et répondre au message.', it: 'Accedi per leggere e rispondere al messaggio.', sq: 'Hyni për të lexuar dhe për t\'iu përgjigjur mesazhit.' },
  msgViewBtn:     { de: 'Nachricht anzeigen', en: 'View message', fr: 'Voir le message', it: 'Visualizza messaggio', sq: 'Shiko mesazhin' },
  contactSubject: { de: 'Kontaktanfrage', en: 'Contact request', fr: 'Demande de contact', it: 'Richiesta di contatto', sq: 'Kërkesë kontakti' },
  contactTitle:   { de: 'Neue Kontaktanfrage', en: 'New contact request', fr: 'Nouvelle demande de contact', it: 'Nuova richiesta di contatto', sq: 'Kërkesë e re kontakti' },
  contactName:    { de: 'Name', en: 'Name', fr: 'Nom', it: 'Nome', sq: 'Emri' },
  contactEmail:   { de: 'E-Mail', en: 'Email', fr: 'E-mail', it: 'E-mail', sq: 'Email' },
  contactPhone:   { de: 'Telefon', en: 'Phone', fr: 'Téléphone', it: 'Telefono', sq: 'Telefon' },
  contactSubj:    { de: 'Betreff', en: 'Subject', fr: 'Objet', it: 'Oggetto', sq: 'Subjekti' },
  contactReply:   { de: 'Antworten', en: 'Reply', fr: 'Répondre', it: 'Rispondi', sq: 'Përgjigju' },
  testSubject:    { de: 'Test E-Mail', en: 'Test Email', fr: 'E-mail de test', it: 'Email di test', sq: 'Email testuese' },
  testSuccess:    { de: 'SMTP Test erfolgreich', en: 'SMTP Test successful', fr: 'Test SMTP réussi', it: 'Test SMTP riuscito', sq: 'Testi SMTP i suksesshëm' },
  testDesc:       { de: 'Diese E-Mail bestätigt, dass Ihre SMTP-Einstellungen korrekt konfiguriert sind.', en: 'This email confirms that your SMTP settings are correctly configured.', fr: 'Cet e-mail confirme que vos paramètres SMTP sont correctement configurés.', it: 'Questa email conferma che le impostazioni SMTP sono configurate correttamente.', sq: 'Ky email konfirmon që cilësimet tuaja SMTP janë konfiguruar saktë.' },
  subConfirmSubj: { de: 'Dein Premium-Abo ist aktiv', en: 'Your Premium subscription is active', fr: 'Votre abonnement Premium est actif', it: 'Il tuo abbonamento Premium è attivo', sq: 'Abonimi juaj Premium është aktiv' },
  subActivated:   { de: 'Premium aktiviert!', en: 'Premium activated!', fr: 'Premium activé !', it: 'Premium attivato!', sq: 'Premium u aktivizua!' },
  subThankUpgrade:{ de: 'Vielen Dank für dein Upgrade auf', en: 'Thank you for upgrading to', fr: 'Merci d\'avoir souscrit à', it: 'Grazie per aver effettuato l\'upgrade a', sq: 'Faleminderit për përmirësimin në' },
  subAllFeatures: { de: 'Du hast jetzt Zugang zu allen Premium-Funktionen.', en: 'You now have access to all Premium features.', fr: 'Vous avez maintenant accès à toutes les fonctionnalités Premium.', it: 'Ora hai accesso a tutte le funzionalità Premium.', sq: 'Tani keni akses në të gjitha funksionet Premium.' },
  plan:           { de: 'Plan', en: 'Plan', fr: 'Plan', it: 'Piano', sq: 'Plani' },
  nextBilling:    { de: 'Nächste Abrechnung', en: 'Next billing', fr: 'Prochaine facturation', it: 'Prossima fatturazione', sq: 'Faturimi i ardhshëm' },
  subManage:      { de: 'Du kannst dein Abo jederzeit in den Einstellungen verwalten oder kündigen.', en: 'You can manage or cancel your subscription anytime in your settings.', fr: 'Vous pouvez gérer ou résilier votre abonnement à tout moment dans vos paramètres.', it: 'Puoi gestire o annullare il tuo abbonamento in qualsiasi momento nelle impostazioni.', sq: 'Mund ta menaxhoni ose anuloni abonimin tuaj në çdo kohë në cilësimet tuaja.' },
  subCancelSubj:  { de: 'Dein Premium-Abo wurde gekündigt', en: 'Your Premium subscription has been cancelled', fr: 'Votre abonnement Premium a été résilié', it: 'Il tuo abbonamento Premium è stato annullato', sq: 'Abonimi juaj Premium u anulua' },
  subCancelTitle: { de: 'Abo-Kündigung bestätigt', en: 'Subscription cancellation confirmed', fr: 'Résiliation confirmée', it: 'Cancellazione confermata', sq: 'Anulimi i abonimit u konfirmua' },
  subCancelText:  { de: 'Dein Premium-Abo wurde gekündigt. Dein Zugang bleibt bis zum', en: 'Your Premium subscription has been cancelled. Your access remains active until', fr: 'Votre abonnement Premium a été résilié. Votre accès reste actif jusqu\'au', it: 'Il tuo abbonamento Premium è stato annullato. Il tuo accesso rimarrà attivo fino al', sq: 'Abonimi juaj Premium u anulua. Aksesi juaj mbetet aktiv deri më' },
  subCancelUndo:  { de: 'Du kannst die Kündigung jederzeit vor dem Ablaufdatum rückgängig machen.', en: 'You can undo the cancellation anytime before the expiry date.', fr: 'Vous pouvez annuler la résiliation à tout moment avant la date d\'expiration.', it: 'Puoi annullare la cancellazione in qualsiasi momento prima della data di scadenza.', sq: 'Mund ta anuloni anulimin në çdo kohë para datës së skadimit.' },
  openSettings:   { de: 'Einstellungen öffnen', en: 'Open settings', fr: 'Ouvrir les paramètres', it: 'Apri impostazioni', sq: 'Hap cilësimet' },
  payFailSubj:    { de: 'Zahlung fehlgeschlagen', en: 'Payment failed', fr: 'Paiement échoué', it: 'Pagamento fallito', sq: 'Pagesa dështoi' },
  payFailTitle:   { de: 'Zahlung fehlgeschlagen', en: 'Payment failed', fr: 'Paiement échoué', it: 'Pagamento fallito', sq: 'Pagesa dështoi' },
  payFailText:    { de: 'Die letzte Zahlung für dein Premium-Abo konnte nicht verarbeitet werden. Bitte überprüfe deine Zahlungsinformationen.', en: 'The last payment for your Premium subscription could not be processed. Please check your payment details.', fr: 'Le dernier paiement de votre abonnement Premium n\'a pas pu être traité. Veuillez vérifier vos informations de paiement.', it: 'L\'ultimo pagamento per il tuo abbonamento Premium non è stato elaborato. Controlla i tuoi dati di pagamento.', sq: 'Pagesa e fundit për abonimin tuaj Premium nuk u përpunua. Ju lutem kontrolloni informacionet e pagesës.' },
  payFailRetry:   { de: 'Nächster Zahlungsversuch:', en: 'Next payment attempt:', fr: 'Prochaine tentative de paiement :', it: 'Prossimo tentativo di pagamento:', sq: 'Përpjekja e ardhshme e pagesës:' },
  payFailBtn:     { de: 'Zahlungsmethode aktualisieren', en: 'Update payment method', fr: 'Mettre à jour le moyen de paiement', it: 'Aggiorna metodo di pagamento', sq: 'Përditëso metodën e pagesës' },
  invoiceSubj:    { de: 'Neue Rechnung verfügbar', en: 'New invoice available', fr: 'Nouvelle facture disponible', it: 'Nuova fattura disponibile', sq: 'Faturë e re e disponueshme' },
  invoiceText:    { de: 'Eine neue Rechnung über', en: 'A new invoice for', fr: 'Une nouvelle facture de', it: 'Una nuova fattura di', sq: 'Një faturë e re prej' },
  invoiceAvail:   { de: 'ist verfügbar.', en: 'is available.', fr: 'est disponible.', it: 'è disponibile.', sq: 'është e disponueshme.' },
  invoiceBtn:     { de: 'Rechnung anzeigen', en: 'View invoice', fr: 'Voir la facture', it: 'Visualizza fattura', sq: 'Shiko faturën' },
  renewSubj:      { de: 'Dein Premium-Abo wurde verlängert', en: 'Your Premium subscription has been renewed', fr: 'Votre abonnement Premium a été renouvelé', it: 'Il tuo abbonamento Premium è stato rinnovato', sq: 'Abonimi juaj Premium u rinovua' },
  renewTitle:     { de: 'Abo erfolgreich verlängert', en: 'Subscription renewed successfully', fr: 'Abonnement renouvelé avec succès', it: 'Abbonamento rinnovato con successo', sq: 'Abonimi u rinovua me sukses' },
  renewText:      { de: 'Abo wurde erfolgreich verlängert.', en: 'subscription has been renewed successfully.', fr: 'abonnement a été renouvelé avec succès.', it: 'abbonamento è stato rinnovato con successo.', sq: 'abonimi u rinovua me sukses.' },
  renewThanks:    { de: 'Vielen Dank für dein Vertrauen!', en: 'Thank you for your trust!', fr: 'Merci pour votre confiance !', it: 'Grazie per la tua fiducia!', sq: 'Faleminderit për besimin tuaj!' },
};

function t(key: string, locale: EmailLocale): string {
  return i18n[key]?.[locale] ?? i18n[key]?.de ?? key;
}

// ─── Enterprise HTML Template ───────────────────────────

function wrapTemplate(title: string, content: string, locale: EmailLocale = 'de'): string {
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${title}</title>
  <style>:root{color-scheme:light only;}</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;color:#1e293b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #162C66 0%, #0F1E45 100%);padding:24px 32px;text-align:center;">
              <a href="${env.FRONTEND_URL}" style="text-decoration:none;">
                <img src="${env.FRONTEND_URL}/logo.png" alt="gjej-pune.com" width="180" style="max-width:180px;height:auto;display:inline-block;" />
              </a>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;background-color:#ffffff;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:20px 32px;border-top:1px solid #e8ecf1;">
              <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
                &copy; ${new Date().getFullYear()} gjej-pune.com &mdash; ${t('allRights', locale)}.<br>
                <a href="${env.FRONTEND_URL}" style="color:#162C66;text-decoration:none;font-weight:600;">gjej-pune.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Email (core) ──────────────────────────────────

async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  try {
    // Fix common typos
    to = fixEmailTypos(to);

    // Check if domain can receive emails (MX record)
    const deliverable = await isDeliverableEmail(to);
    if (!deliverable) {
      console.warn('[Email] No MX record for domain, skipping email to:', to);
      return false;
    }

    // Validate replyTo address if provided
    if (replyTo) {
      replyTo = fixEmailTypos(replyTo);
      const replyToDeliverable = await isDeliverableEmail(replyTo);
      if (!replyToDeliverable) {
        console.warn('[Email] No MX record for replyTo domain, removing replyTo:', replyTo);
        replyTo = undefined;
      }
    }

    const settings = await getSmtpSettings();
    if (!settings.smtpHost || !settings.smtpUser) {
      console.warn('[Email] SMTP not configured, skipping email to:', to);
      return false;
    }

    const secure = settings.encryption === 'ssl';
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      ...(settings.encryption === 'tls' ? { requireTLS: true, tls: { rejectUnauthorized: false } } : {}),
      ...(settings.encryption === 'ssl' ? { tls: { rejectUnauthorized: false } } : {}),
    });

    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log('[Email] Sent successfully to:', to);
    return true;
  } catch (err) {
    console.error('[Email] Failed to send to:', to, err);
    return false;
  }
}

// ─── Welcome Email ──────────────────────────────────────

export async function sendWelcomeEmail(email: string, displayName: string, role: string, locale?: string) {
  const l = validLocale(locale);
  const isEmployer = role === 'employer';
  const subject = t('welcomeSubject', l);
  const safeName = escapeHtml(displayName);

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('welcomeHello', l)}, ${safeName}! 🎉
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('welcomeThank', l)} <strong>gjej-pune.com</strong>.
      ${isEmployer ? t('welcomeEmp', l) : t('welcomeSeeker', l)}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${env.FRONTEND_URL}/${l}/dashboard/${isEmployer ? 'employer' : 'job-seeker'}"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${isEmployer ? t('toDashboard', l) : t('createProfile', l)}
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      ${t('questionsHelp', l)}
    </p>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── Password Reset Email ───────────────────────────────

export async function sendPasswordResetEmail(email: string, displayName: string, resetToken: string, locale?: string) {
  const l = validLocale(locale);
  const subject = `${t('resetSubject', l)} — gjej-pune.com`;
  const resetUrl = `${env.FRONTEND_URL}/${l}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
  const safeName = escapeHtml(displayName);

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('resetSubject', l)}
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      ${t('resetText', l)}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('resetBtn', l)}
      </a>
    </div>
    <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.6;">
      ${t('resetExpiry', l)}
    </p>
    <div style="background:#f8f9fb;border-radius:8px;padding:12px 16px;margin-top:16px;">
      <p style="margin:0;color:#64748b;font-size:12px;word-break:break-all;">
        ${t('resetFallback', l)}<br>
        <a href="${resetUrl}" style="color:#162C66;">${resetUrl}</a>
      </p>
    </div>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── New Message Notification Email ─────────────────────

export async function sendNewMessageNotification(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeSender = escapeHtml(senderName);
  const safeRecipient = escapeHtml(recipientName);
  const subject = `${t('msgSubject', l)} ${safeSender} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('msgTitle', l)} 💬
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeRecipient},<br><br>
      <strong>${safeSender}</strong> ${t('msgSentYou', l)}
    </p>
    <p style="margin:0 0 20px;color:#1e293b;font-size:14px;line-height:1.6;">
      ${t('msgLoginToRead', l)}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${env.FRONTEND_URL}/${l}/dashboard/employer/messages"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('msgViewBtn', l)}
      </a>
    </div>`;

  return sendEmail(recipientEmail, subject, wrapTemplate(subject, content, l));
}

// ─── Contact Form Email ─────────────────────────────────

export async function sendContactEmail(
  senderName: string,
  senderEmail: string,
  subject: string,
  message: string,
  phone?: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(senderName);
  const safeEmail = escapeHtml(senderEmail);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message);
  const safePhone = phone ? escapeHtml(phone) : '';

  // Get admin email to send TO (fetched once, sendEmail will fetch again for SMTP config)
  const settings = await getSmtpSettings();
  const adminEmail = settings.fromEmail || 'noreply@gjej-pune.com';

  const emailSubject = `${t('contactSubject', l)}: ${safeSubject} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('contactTitle', l)} 📩
    </h2>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;width:120px;">${t('contactName', l)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:500;">${safeName}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;">${t('contactEmail', l)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:500;">
          <a href="mailto:${safeEmail}" style="color:#162C66;text-decoration:none;">${safeEmail}</a>
        </td>
      </tr>
      ${safePhone ? `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;">${t('contactPhone', l)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:500;">${safePhone}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;">${t('contactSubj', l)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:500;">${safeSubject}</td>
      </tr>
    </table>
    <div style="background:#f8f9fb;border-left:4px solid #162C66;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="mailto:${safeEmail}?subject=Re: ${encodeURIComponent(subject)}"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('contactReply', l)}
      </a>
    </div>`;

  return sendEmail(adminEmail, emailSubject, wrapTemplate(emailSubject, content, l), senderEmail);
}

// ─── Test Email (Admin) ─────────────────────────────────

export async function sendTestEmail(toAddress: string, locale?: string) {
  const l = validLocale(locale);
  const subject = `${t('testSubject', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('testSuccess', l)} ✅
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('testDesc', l)}
    </p>
    <p style="margin:0;color:#94a3b8;font-size:13px;">
      ${new Date().toLocaleString('de-CH')}
    </p>`;

  return sendEmail(toAddress, subject, wrapTemplate(subject, content, l));
}

// ─── Subscription Confirmation Email ─────────────────────

export async function sendSubscriptionConfirmation(
  email: string,
  displayName: string,
  planLabel: string,
  nextBillingDate: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(displayName);
  const safePlan = escapeHtml(planLabel);
  const subject = `${t('subConfirmSubj', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('subActivated', l)} 🎉
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      ${t('subThankUpgrade', l)} <strong>${safePlan}</strong>!
      ${t('subAllFeatures', l)}
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;width:160px;">${t('plan', l)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:600;">${safePlan}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;">${t('nextBilling', l)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:600;">${escapeHtml(nextBillingDate)}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:28px 0;">
      <a href="${env.FRONTEND_URL}/${l}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#F5C400,#FFD740);color:#162C66;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('toDashboard', l)}
      </a>
    </div>
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      ${t('subManage', l)}
    </p>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── Subscription Cancelled Email ────────────────────────

export async function sendSubscriptionCancelled(
  email: string,
  displayName: string,
  endDate: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(displayName);
  const subject = `${t('subCancelSubj', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('subCancelTitle', l)}
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      ${t('subCancelText', l)}
      <strong>${escapeHtml(endDate)}</strong>.
    </p>
    <div style="background:#fef3c7;border-left:4px solid #F5C400;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
        ${t('subCancelUndo', l)}
      </p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${env.FRONTEND_URL}/${l}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('openSettings', l)}
      </a>
    </div>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── Payment Failed Email ────────────────────────────────

export async function sendPaymentFailed(
  email: string,
  displayName: string,
  retryDate: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(displayName);
  const subject = `${t('payFailSubj', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('payFailTitle', l)} ⚠️
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      ${t('payFailText', l)}
    </p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">
        ${t('payFailRetry', l)} <strong>${escapeHtml(retryDate)}</strong>
      </p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${env.FRONTEND_URL}/${l}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('payFailBtn', l)}
      </a>
    </div>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── Invoice Ready Email ─────────────────────────────────

export async function sendInvoiceReady(
  email: string,
  displayName: string,
  invoiceUrl: string,
  amount: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(displayName);
  const subject = `${t('invoiceSubj', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('invoiceSubj', l)}
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      ${t('invoiceText', l)} <strong>${escapeHtml(amount)}</strong> ${t('invoiceAvail', l)}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${escapeHtml(invoiceUrl)}"
         style="display:inline-block;background:linear-gradient(135deg,#162C66,#0F1E45);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
        ${t('invoiceBtn', l)}
      </a>
    </div>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}

// ─── Subscription Renewed Email ──────────────────────────

export async function sendSubscriptionRenewed(
  email: string,
  displayName: string,
  planLabel: string,
  nextBillingDate: string,
  locale?: string
) {
  const l = validLocale(locale);
  const safeName = escapeHtml(displayName);
  const safePlan = escapeHtml(planLabel);
  const subject = `${t('renewSubj', l)} — gjej-pune.com`;

  const content = `
    <h2 style="margin:0 0 16px;color:#0B1F44;font-size:20px;font-weight:700;">
      ${t('renewTitle', l)} ✅
    </h2>
    <p style="margin:0 0 16px;color:#1e293b;font-size:15px;line-height:1.7;">
      ${t('resetHello', l)} ${safeName},<br><br>
      <strong>${safePlan}</strong> ${t('renewText', l)}
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;width:160px;">${t('plan', l)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:600;">${safePlan}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#64748b;font-size:13px;font-weight:600;">${t('nextBilling', l)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8ecf1;color:#0B1F44;font-size:14px;font-weight:600;">${escapeHtml(nextBillingDate)}</td>
      </tr>
    </table>
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      ${t('renewThanks', l)}
    </p>`;

  return sendEmail(email, subject, wrapTemplate(subject, content, l));
}
