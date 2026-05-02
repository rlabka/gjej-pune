import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo Admin accounts
  const adminEmails = ['admin@gjej-pune.com', 'admin@holino.de'];
  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: await bcrypt.hash('admin123', 12),
        displayName: 'Admin Demo',
        role: 'admin',
      },
    });
    console.log(`  ✅ Admin: ${email} / admin123`);
  }

  // Demo Employer
  await prisma.user.upsert({
    where: { email: 'employer@gjej-pune.com' },
    update: {},
    create: {
      email: 'employer@gjej-pune.com',
      password: await bcrypt.hash('employer123', 12),
      displayName: 'TechFlow GmbH',
      role: 'employer',
    },
  });
  console.log('  ✅ Employer: employer@gjej-pune.com / employer123');

  // Demo Job Seeker
  await prisma.user.upsert({
    where: { email: 'jobseeker@gjej-pune.com' },
    update: {},
    create: {
      email: 'jobseeker@gjej-pune.com',
      password: await bcrypt.hash('jobseeker123', 12),
      displayName: 'Sarah Müller',
      role: 'job-seeker',
    },
  });
  console.log('  ✅ Job Seeker: jobseeker@gjej-pune.com / jobseeker123');

  // ─── Fetch user IDs for seeding relations ─────────────
  const employer = await prisma.user.findUnique({ where: { email: 'employer@gjej-pune.com' } });
  const jobSeeker = await prisma.user.findUnique({ where: { email: 'jobseeker@gjej-pune.com' } });
  if (!employer || !jobSeeker) throw new Error('Seed users not found');

  // ─── Demo Job Offers (Employer) ───────────────────────
  console.log('\n  Seeding jobs...');
  const jobsData = [
    { category: 'Babysitter', contactName: 'Maria', contactSurname: 'Mueller', contactPhone: '+41 79 123 45 67', contactEmail: 'maria@example.com', companyName: 'Familie Mueller', salary: 1000, salaryType: 'Month', locationState: 'Zuerich', locationCity: 'Zuerich', when: 'Urgent', description: 'Family looking for an experienced babysitter for two children aged 3 and 6. Afternoon care Mon-Fri.' },
    { category: 'Waiter / Waitress', contactName: 'Thomas', contactSurname: 'Bauer', contactPhone: '+41 78 234 56 78', contactEmail: 'bellevue@example.com', companyName: 'Restaurant Bellevue', salary: 4200, salaryType: 'Month', locationState: 'Bern', locationCity: 'Bern', when: 'Urgent', description: 'Friendly waiter/waitress needed. Evening shifts, good tips. Fine dining experience preferred.' },
    { category: 'Caregiver for elderly', contactName: 'Hans', contactSurname: 'Schmid', contactPhone: '+41 76 345 67 89', contactEmail: 'privat@example.com', companyName: '', salary: 30, salaryType: 'Hour', locationState: 'Basel', locationCity: 'Basel', when: 'Negotiation', description: 'Compassionate caregiver needed for elderly gentleman. Daily meals, light housekeeping, companionship.' },
    { category: 'Cleaner', contactName: 'Anna', contactSurname: 'Weber', contactPhone: '+41 77 456 78 90', contactEmail: 'cleanpro@example.com', companyName: 'CleanPro GmbH', salary: 25, salaryType: 'Hour', locationState: 'Luzern', locationCity: 'Luzern', when: 'Negotiation', description: 'Reliable cleaner for office spaces. Flexible hours, morning or evening shifts.' },
    { category: 'Cook / Chef', contactName: 'Peter', contactSurname: 'Keller', contactPhone: '+41 79 567 89 01', contactEmail: 'loewen@example.com', companyName: 'Gasthaus zum Loewen', salary: 5500, salaryType: 'Month', locationState: 'Winterthur', locationCity: 'Winterthur', when: 'Urgent', description: 'Traditional Swiss restaurant looking for an experienced cook. Menu planning and kitchen management.' },
    { category: 'Nanny', contactName: 'Sophie', contactSurname: 'Brunner', contactPhone: '+41 78 678 90 12', contactEmail: 'weber@example.com', companyName: 'Familie Weber', salary: 4800, salaryType: 'Month', locationState: 'Genf', locationCity: 'Genf', when: 'Negotiation', description: 'Full-time nanny for family with three children. French and English speaking preferred.' },
    { category: 'Driver', contactName: 'Marco', contactSurname: 'Rossi', contactPhone: '+41 79 789 01 23', contactEmail: 'transport@example.com', companyName: 'Swiss Transport AG', salary: 4500, salaryType: 'Month', locationState: 'Zuerich', locationCity: 'Winterthur', when: 'Urgent', description: 'Delivery driver needed for regional routes. Valid drivers license required. Company vehicle provided.' },
    { category: 'Electrician', contactName: 'Lukas', contactSurname: 'Fischer', contactPhone: '+41 76 890 12 34', contactEmail: 'elektro@example.com', companyName: 'Fischer Elektro', salary: 35, salaryType: 'Hour', locationState: 'Bern', locationCity: 'Thun', when: 'Negotiation', description: 'Licensed electrician for residential and commercial projects. Own tools preferred.' },
  ];

  for (const data of jobsData) {
    await prisma.job.create({
      data: { ...data, userId: employer.id, status: 'Active', countryCode: 'CH' },
    });
  }
  console.log('  ✅ ' + jobsData.length + ' jobs created');

  // ─── Demo Job Seeker Ads ──────────────────────────────
  console.log('\n  Seeding job seeker ads...');
  const adsData = [
    { category: 'Babysitter', firstName: 'Sarah', surname: 'Mueller', phone: '+41 79 111 22 33', email: 'sarah@example.com', experience: '3 years', livingPlace: 'Zuerich, Switzerland', lat: 47.3769, lng: 8.5417, skills: JSON.stringify(['Communication', 'Patience', 'Responsibility']) },
    { category: 'Cleaner', firstName: 'Elena', surname: 'Kovac', phone: '+41 78 222 33 44', email: 'elena@example.com', experience: '5+ years', livingPlace: 'Basel, Switzerland', lat: 47.5596, lng: 7.5886, skills: JSON.stringify(['Professionalism', 'Time Management', 'Responsibility']) },
    { category: 'Cook / Chef', firstName: 'Ahmed', surname: 'Hassan', phone: '+41 76 333 44 55', email: 'ahmed@example.com', experience: '10+ years', livingPlace: 'Bern, Switzerland', lat: 46.9480, lng: 7.4474, skills: JSON.stringify(['Teamwork', 'Stress Management', 'Problem Solving']) },
  ];

  for (const data of adsData) {
    await prisma.jobSeekerAd.create({
      data: { ...data, userId: jobSeeker.id, status: 'Active', countryCode: 'CH' },
    });
  }
  console.log('  ✅ ' + adsData.length + ' job seeker ads created');

  // ─── Legal Texts (German) ─────────────────────────────────────
  console.log('\n  Seeding legal texts...');

  const legalTexts: { fieldKey: string; value: string }[] = [
    {
      fieldKey: 'impressum',
      value: `<h2>Impressum</h2>
<p><strong>gjej-pune.com</strong><br>
Eine Plattform der gjej-pune UG (haftungsbeschränkt)<br>
Musterstraße 1<br>
10115 Berlin, Deutschland</p>

<h3>Kontakt</h3>
<p>E-Mail: info@gjej-pune.com<br>
Telefon: +49 (0) 30 123456-0<br>
Website: <a href="https://www.gjej-pune.com">www.gjej-pune.com</a></p>

<h3>Vertreten durch</h3>
<p>Geschäftsführer: [Name des Geschäftsführers]</p>

<h3>Registereintrag</h3>
<p>Eingetragen im Handelsregister.<br>
Registergericht: Amtsgericht Berlin-Charlottenburg<br>
Registernummer: HRB [Nummer]</p>

<h3>Umsatzsteuer-ID</h3>
<p>Umsatzsteuer-Identifikationsnummer gemäß §27a Umsatzsteuergesetz:<br>
DE [Nummer]</p>

<h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
<p>[Name des Verantwortlichen]<br>
Musterstraße 1<br>
10115 Berlin, Deutschland</p>

<h3>Streitschlichtung</h3>
<p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br>
Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
<p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

<h3>Haftung für Inhalte</h3>
<p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
<p>Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>

<h3>Haftung für Links</h3>
<p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>

<h3>Urheberrecht</h3>
<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>`,
    },
    {
      fieldKey: 'datenschutz',
      value: `<h2>Datenschutzerklärung</h2>

<h3>1. Datenschutz auf einen Blick</h3>
<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>

<h3>2. Allgemeine Hinweise und Pflichtinformationen</h3>
<p><strong>Verantwortliche Stelle:</strong><br>
gjej-pune UG (haftungsbeschränkt)<br>
Musterstraße 1<br>
10115 Berlin, Deutschland<br>
E-Mail: datenschutz@gjej-pune.com</p>

<h3>3. Datenerfassung auf unserer Website</h3>

<h4>3.1 Registrierung</h4>
<p>Bei der Registrierung auf unserer Plattform erheben wir folgende Daten:</p>
<ul>
<li>E-Mail-Adresse (Pflichtfeld)</li>
<li>Passwort (verschlüsselt gespeichert)</li>
<li>Name/Anzeigename</li>
<li>Rolle (Arbeitssuchender oder Arbeitgeber)</li>
</ul>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</p>

<h4>3.2 Nutzung der Plattform</h4>
<p>Bei der Nutzung von gjej-pune.com als Jobvermittlungsplattform verarbeiten wir:</p>
<ul>
<li><strong>Für Arbeitssuchende:</strong> Profilinformationen, Berufserfahrung, Ausbildung, Lebenslauf, Kontaktdaten, Standort</li>
<li><strong>Für Arbeitgeber:</strong> Unternehmensinformationen, Stellenausschreibungen, Kontaktdaten</li>
<li><strong>Für alle Nutzer:</strong> Nachrichten innerhalb der Plattform, Favoriten, Bewerbungshistorie</li>
</ul>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</p>

<h4>3.3 Server-Log-Dateien</h4>
<p>Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt:</p>
<ul>
<li>Browsertyp und Browserversion</li>
<li>Verwendetes Betriebssystem</li>
<li>Referrer URL</li>
<li>Hostname des zugreifenden Rechners</li>
<li>Uhrzeit der Serveranfrage</li>
<li>IP-Adresse</li>
</ul>
<p>Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.</p>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>

<h4>3.4 Cookies</h4>
<p>Unsere Website verwendet Cookies. Dabei handelt es sich um kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Wir verwenden:</p>
<ul>
<li><strong>Technisch notwendige Cookies:</strong> Für die Funktionalität der Website (Session-Management, Authentifizierung)</li>
<li><strong>Sprach-Cookies:</strong> Um Ihre bevorzugte Sprache zu speichern</li>
</ul>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>

<h3>4. Zweck der Datenverarbeitung</h3>
<p>Wir verarbeiten Ihre personenbezogenen Daten zu folgenden Zwecken:</p>
<ul>
<li>Bereitstellung und Betrieb der Jobvermittlungsplattform</li>
<li>Verwaltung Ihres Benutzerkontos</li>
<li>Vermittlung zwischen Arbeitssuchenden und Arbeitgebern</li>
<li>Kommunikation über die Plattform-Messaging-Funktion</li>
<li>Verbesserung und Optimierung unserer Dienstleistungen</li>
<li>Gewährleistung der Sicherheit unserer Plattform</li>
</ul>

<h3>5. Speicherdauer</h3>
<p>Ihre personenbezogenen Daten werden so lange gespeichert, wie Ihr Benutzerkonto aktiv ist. Nach Löschung Ihres Kontos werden Ihre Daten innerhalb von 30 Tagen unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>

<h3>6. Ihre Rechte</h3>
<p>Sie haben jederzeit das Recht:</p>
<ul>
<li><strong>Auskunft</strong> über Ihre gespeicherten Daten zu erhalten (Art. 15 DSGVO)</li>
<li><strong>Berichtigung</strong> unrichtiger Daten zu verlangen (Art. 16 DSGVO)</li>
<li><strong>Löschung</strong> Ihrer Daten zu verlangen (Art. 17 DSGVO)</li>
<li><strong>Einschränkung</strong> der Verarbeitung zu verlangen (Art. 18 DSGVO)</li>
<li><strong>Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)</li>
<li><strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art. 21 DSGVO)</li>
<li>Sich bei einer <strong>Aufsichtsbehörde zu beschweren</strong> (Art. 77 DSGVO)</li>
</ul>

<h3>7. Datensicherheit</h3>
<p>Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in Verbindung mit der jeweils höchsten Verschlüsselungsstufe. Passwörter werden ausschließlich in verschlüsselter Form (bcrypt) gespeichert.</p>

<h3>8. Kontakt für Datenschutzfragen</h3>
<p>Bei Fragen zum Datenschutz erreichen Sie uns unter:<br>
E-Mail: datenschutz@gjej-pune.com</p>`,
    },
    {
      fieldKey: 'agb',
      value: `<h2>Allgemeine Geschäftsbedingungen (AGB)</h2>

<h3>§ 1 Geltungsbereich</h3>
<p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Online-Plattform gjej-pune.com (nachfolgend „Plattform"), betrieben von der gjej-pune UG (haftungsbeschränkt), Musterstraße 1, 10115 Berlin (nachfolgend „Betreiber").</p>
<p>Durch die Registrierung und Nutzung der Plattform erklärt sich der Nutzer mit diesen AGB einverstanden.</p>

<h3>§ 2 Leistungsbeschreibung</h3>
<p>gjej-pune.com ist eine Jobvermittlungsplattform, die folgende Dienste anbietet:</p>
<ul>
<li><strong>Für Arbeitssuchende:</strong> Erstellung eines Profils, Suche nach Stellenangeboten, Kontaktaufnahme mit Arbeitgebern über die Plattform-Messaging-Funktion, Speichern von Favoriten</li>
<li><strong>Für Arbeitgeber:</strong> Erstellung und Verwaltung von Stellenangeboten, Suche nach geeigneten Kandidaten, Kontaktaufnahme über die Plattform-Messaging-Funktion</li>
<li><strong>Allgemein:</strong> Mehrsprachige Unterstützung (Deutsch, Englisch, Französisch, Italienisch, Albanisch), sichere Nachrichtenübermittlung, Profilbewertungen</li>
</ul>
<p>Die Plattform dient ausschließlich der Vermittlung. Der Betreiber ist kein Vertragspartner bei Arbeitsverträgen zwischen Arbeitssuchenden und Arbeitgebern.</p>

<h3>§ 3 Registrierung und Benutzerkonto</h3>
<ol>
<li>Die Nutzung der Plattform erfordert eine Registrierung mit gültiger E-Mail-Adresse und einem Passwort.</li>
<li>Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße Angaben zu machen und seine Daten aktuell zu halten.</li>
<li>Die Zugangsdaten sind vertraulich zu behandeln. Der Nutzer haftet für alle Aktivitäten, die unter seinem Konto stattfinden.</li>
<li>Pro Person ist nur ein Benutzerkonto gestattet.</li>
</ol>

<h3>§ 4 Pflichten der Nutzer</h3>
<p>Der Nutzer verpflichtet sich:</p>
<ul>
<li>Keine falschen oder irreführenden Informationen zu veröffentlichen</li>
<li>Die Plattform nicht für rechtswidrige Zwecke zu nutzen</li>
<li>Keine diskriminierenden, beleidigenden oder anderweitig anstößigen Inhalte einzustellen</li>
<li>Die Rechte Dritter (insbesondere Urheberrechte, Persönlichkeitsrechte) zu respektieren</li>
<li>Keine Spam-Nachrichten zu versenden</li>
<li>Die Kontaktdaten anderer Nutzer nicht für Zwecke außerhalb der Plattform zu verwenden</li>
</ul>

<h3>§ 5 Inhalte und Verantwortung</h3>
<ol>
<li>Der Nutzer ist für alle von ihm eingestellten Inhalte (Stellenangebote, Profilinformationen, Nachrichten) selbst verantwortlich.</li>
<li>Der Betreiber behält sich das Recht vor, Inhalte zu prüfen und bei Verstoß gegen diese AGB oder geltendes Recht zu entfernen.</li>
<li>Der Betreiber übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der von Nutzern eingestellten Inhalte.</li>
</ol>

<h3>§ 6 Haftungsbeschränkung</h3>
<ol>
<li>Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den Vorschriften des Produkthaftungsgesetzes.</li>
<li>Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.</li>
<li>Der Betreiber haftet nicht für die Qualität der vermittelten Arbeitsverhältnisse oder für das Verhalten der Nutzer untereinander.</li>
<li>Der Betreiber gewährleistet keine ununterbrochene Verfügbarkeit der Plattform.</li>
</ol>

<h3>§ 7 Kündigung und Kontolöschung</h3>
<ol>
<li>Der Nutzer kann sein Konto jederzeit in den Einstellungen löschen.</li>
<li>Der Betreiber kann Benutzerkonten bei Verstoß gegen diese AGB mit sofortiger Wirkung sperren oder löschen.</li>
<li>Bei Löschung des Kontos werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</li>
</ol>

<h3>§ 8 Änderungen der AGB</h3>
<p>Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Die Nutzer werden über Änderungen per E-Mail oder durch einen Hinweis auf der Plattform informiert. Die geänderten AGB gelten als angenommen, wenn der Nutzer nicht innerhalb von 14 Tagen nach Benachrichtigung widerspricht.</p>

<h3>§ 9 Schlussbestimmungen</h3>
<ol>
<li>Es gilt das Recht der Bundesrepublik Deutschland.</li>
<li>Gerichtsstand ist Berlin, sofern der Nutzer Kaufmann ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.</li>
<li>Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</li>
</ol>

<p><em>Stand: Januar 2025</em></p>`,
    },
  ];

  for (const text of legalTexts) {
    await prisma.siteContent.upsert({
      where: {
        section_fieldKey_locale: {
          section: 'Legal',
          fieldKey: text.fieldKey,
          locale: 'de',
        },
      },
      update: { value: text.value, type: 'richText' },
      create: {
        section: 'Legal',
        fieldKey: text.fieldKey,
        locale: 'de',
        value: text.value,
        type: 'richText',
      },
    });
  }
  console.log('  ✅ Legal texts seeded (Impressum, Datenschutz, AGB)');

  // ─── Subscription Plans ──────────────────────────────────────
  console.log('\n  Seeding subscription plans...');

  const plansData = [
    { label: 'Premium 1 Monat',  role: 'employer', intervalType: 'month', intervalCount: 1, amountCents: 5900,  oldPriceCents: 8900,  isBestOffer: false, sortOrder: 0 },
    { label: 'Premium 3 Monate', role: 'employer', intervalType: 'month', intervalCount: 3, amountCents: 12000, oldPriceCents: 17700, isBestOffer: false, sortOrder: 1 },
    { label: 'Premium 6 Monate', role: 'employer', intervalType: 'month', intervalCount: 6, amountCents: 16000, oldPriceCents: 35400, isBestOffer: true,  sortOrder: 2 },
  ];

  for (const plan of plansData) {
    const existing = await prisma.plan.findFirst({
      where: { role: plan.role, intervalType: plan.intervalType, intervalCount: plan.intervalCount },
    });
    if (!existing) {
      await prisma.plan.create({ data: { ...plan, currency: 'eur' } });
    }
  }
  console.log('  ✅ ' + plansData.length + ' subscription plans seeded');

  console.log('\n  Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
