import { PrismaClient } from '@prisma/client';
import path from 'path';

const DB_PATH = path.resolve(__dirname, 'dev.db');
const prisma = new PrismaClient({
  datasources: { db: { url: `file:${DB_PATH}` } },
});

// ─────────────────────────────────────────────────────────────
// IMPRESSUM
// ─────────────────────────────────────────────────────────────

const impressum_de = `<h2>Impressum</h2>
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
<p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>

<h3>Urheberrecht</h3>
<p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>`;

const impressum_en = `<h2>Legal Notice</h2>
<p><strong>gjej-pune.com</strong><br>
A platform operated by gjej-pune UG (limited liability)<br>
Musterstraße 1<br>
10115 Berlin, Germany</p>

<h3>Contact</h3>
<p>Email: info@gjej-pune.com<br>
Phone: +49 (0) 30 123456-0<br>
Website: <a href="https://www.gjej-pune.com">www.gjej-pune.com</a></p>

<h3>Represented by</h3>
<p>Managing Director: [Name of Managing Director]</p>

<h3>Commercial Register</h3>
<p>Registered in the commercial register.<br>
Registration court: Amtsgericht Berlin-Charlottenburg<br>
Registration number: HRB [Number]</p>

<h3>VAT ID</h3>
<p>VAT identification number according to §27a of the German VAT Act:<br>
DE [Number]</p>

<h3>Responsible for content according to § 55 Abs. 2 RStV</h3>
<p>[Name of responsible person]<br>
Musterstraße 1<br>
10115 Berlin, Germany</p>

<h3>Dispute Resolution</h3>
<p>The European Commission provides a platform for online dispute resolution (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br>
You can find our email address in the legal notice above.</p>
<p>We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.</p>

<h3>Liability for Content</h3>
<p>As a service provider, we are responsible for our own content on these pages in accordance with general legislation pursuant to Section 7 (1) of the German Telemedia Act (TMG). However, according to Sections 8 to 10 TMG, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.</p>
<p>Obligations to remove or block the use of information under general law remain unaffected. However, liability in this regard is only possible from the point in time at which a concrete infringement of the law becomes known. If we become aware of any such infringements, we will remove this content immediately.</p>

<h3>Liability for Links</h3>
<p>Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot accept any liability for this third-party content. The respective provider or operator of the pages is always responsible for the content of the linked pages.</p>

<h3>Copyright</h3>
<p>The content and works created by the site operators on these pages are subject to German copyright law. Duplication, processing, distribution, and any form of commercialization of such material beyond the scope of copyright law require the prior written consent of the respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use.</p>`;

const impressum_fr = `<h2>Mentions légales</h2>
<p><strong>gjej-pune.com</strong><br>
Une plateforme exploitée par gjej-pune UG (à responsabilité limitée)<br>
Musterstraße 1<br>
10115 Berlin, Allemagne</p>

<h3>Contact</h3>
<p>E-mail : info@gjej-pune.com<br>
Téléphone : +49 (0) 30 123456-0<br>
Site web : <a href="https://www.gjej-pune.com">www.gjej-pune.com</a></p>

<h3>Représenté par</h3>
<p>Directeur général : [Nom du directeur général]</p>

<h3>Inscription au registre du commerce</h3>
<p>Inscrit au registre du commerce.<br>
Tribunal d'enregistrement : Amtsgericht Berlin-Charlottenburg<br>
Numéro d'enregistrement : HRB [Numéro]</p>

<h3>Numéro de TVA</h3>
<p>Numéro d'identification TVA conformément au §27a de la loi allemande sur la TVA :<br>
DE [Numéro]</p>

<h3>Responsable du contenu selon § 55 al. 2 RStV</h3>
<p>[Nom du responsable]<br>
Musterstraße 1<br>
10115 Berlin, Allemagne</p>

<h3>Règlement des litiges</h3>
<p>La Commission européenne met à disposition une plateforme de règlement en ligne des litiges (RLL) : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br>
Vous trouverez notre adresse e-mail dans les mentions légales ci-dessus.</p>
<p>Nous ne sommes ni disposés ni obligés de participer à des procédures de règlement des litiges devant un organisme d'arbitrage des consommateurs.</p>

<h3>Responsabilité du contenu</h3>
<p>En tant que prestataire de services, nous sommes responsables de notre propre contenu sur ces pages conformément à la législation générale en vertu de l'article 7, paragraphe 1, de la loi allemande sur les télémédias (TMG). Cependant, conformément aux articles 8 à 10 TMG, nous ne sommes pas tenus de surveiller les informations transmises ou stockées par des tiers.</p>

<h3>Responsabilité des liens</h3>
<p>Notre site web contient des liens vers des sites web externes de tiers sur le contenu desquels nous n'avons aucune influence. Par conséquent, nous ne pouvons accepter aucune responsabilité pour ce contenu tiers.</p>

<h3>Droit d'auteur</h3>
<p>Le contenu et les œuvres créés par les exploitants du site sur ces pages sont soumis au droit d'auteur allemand. La reproduction, le traitement, la distribution et toute forme de commercialisation de ce matériel au-delà du champ d'application du droit d'auteur nécessitent le consentement écrit préalable de l'auteur ou du créateur respectif.</p>`;

const impressum_it = `<h2>Note legali</h2>
<p><strong>gjej-pune.com</strong><br>
Una piattaforma gestita da gjej-pune UG (a responsabilità limitata)<br>
Musterstraße 1<br>
10115 Berlino, Germania</p>

<h3>Contatto</h3>
<p>E-mail: info@gjej-pune.com<br>
Telefono: +49 (0) 30 123456-0<br>
Sito web: <a href="https://www.gjej-pune.com">www.gjej-pune.com</a></p>

<h3>Rappresentato da</h3>
<p>Amministratore delegato: [Nome dell'amministratore delegato]</p>

<h3>Iscrizione al registro delle imprese</h3>
<p>Iscritto nel registro delle imprese.<br>
Tribunale di registrazione: Amtsgericht Berlin-Charlottenburg<br>
Numero di registrazione: HRB [Numero]</p>

<h3>Partita IVA</h3>
<p>Numero di identificazione IVA ai sensi del §27a della legge tedesca sull'IVA:<br>
DE [Numero]</p>

<h3>Responsabile dei contenuti ai sensi del § 55 comma 2 RStV</h3>
<p>[Nome del responsabile]<br>
Musterstraße 1<br>
10115 Berlino, Germania</p>

<h3>Risoluzione delle controversie</h3>
<p>La Commissione europea mette a disposizione una piattaforma per la risoluzione delle controversie online (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br>
Il nostro indirizzo e-mail è disponibile nelle note legali sopra.</p>
<p>Non siamo disposti né obbligati a partecipare a procedimenti di risoluzione delle controversie dinanzi a un organismo di arbitrato dei consumatori.</p>

<h3>Responsabilità per i contenuti</h3>
<p>In qualità di fornitori di servizi, siamo responsabili dei nostri contenuti su queste pagine in conformità con la legislazione generale ai sensi dell'articolo 7, paragrafo 1, della legge tedesca sui media telematici (TMG). Tuttavia, ai sensi degli articoli 8-10 TMG, non siamo obbligati a monitorare le informazioni trasmesse o memorizzate da terzi.</p>

<h3>Responsabilità per i link</h3>
<p>Il nostro sito web contiene link a siti web esterni di terzi sui cui contenuti non abbiamo alcuna influenza. Pertanto, non possiamo assumerci alcuna responsabilità per questi contenuti di terzi.</p>

<h3>Diritto d'autore</h3>
<p>I contenuti e le opere creati dagli operatori del sito su queste pagine sono soggetti alla legge tedesca sul diritto d'autore. La riproduzione, l'elaborazione, la distribuzione e qualsiasi forma di commercializzazione di tale materiale al di là dell'ambito del diritto d'autore richiedono il previo consenso scritto del rispettivo autore o creatore.</p>`;

const impressum_sq = `<h2>Imprint</h2>
<p><strong>gjej-pune.com</strong><br>
Një platformë e operuar nga gjej-pune UG (me përgjegjësi të kufizuar)<br>
Musterstraße 1<br>
10115 Berlin, Gjermani</p>

<h3>Kontakti</h3>
<p>E-mail: info@gjej-pune.com<br>
Telefon: +49 (0) 30 123456-0<br>
Faqja e internetit: <a href="https://www.gjej-pune.com">www.gjej-pune.com</a></p>

<h3>Përfaqësuar nga</h3>
<p>Drejtori menaxhues: [Emri i drejtorit menaxhues]</p>

<h3>Regjistrimi tregtar</h3>
<p>I regjistruar në regjistrin tregtar.<br>
Gjykata e regjistrimit: Amtsgericht Berlin-Charlottenburg<br>
Numri i regjistrimit: HRB [Numri]</p>

<h3>Numri i TVSH-së</h3>
<p>Numri i identifikimit të TVSH-së sipas §27a të Ligjit gjerman të TVSH-së:<br>
DE [Numri]</p>

<h3>Përgjegjës për përmbajtjen sipas § 55 par. 2 RStV</h3>
<p>[Emri i personit përgjegjës]<br>
Musterstraße 1<br>
10115 Berlin, Gjermani</p>

<h3>Zgjidhja e mosmarrëveshjeve</h3>
<p>Komisioni Evropian ofron një platformë për zgjidhjen e mosmarrëveshjeve në internet (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">https://ec.europa.eu/consumers/odr</a>.<br>
Adresën tonë të e-mailit mund ta gjeni në imprint më lart.</p>
<p>Ne nuk jemi të gatshëm ose të detyruar të marrim pjesë në procedurat e zgjidhjes së mosmarrëveshjeve para një bordi arbitrazhi të konsumatorëve.</p>

<h3>Përgjegjësia për përmbajtjen</h3>
<p>Si ofrues shërbimi, ne jemi përgjegjës për përmbajtjen tonë në këto faqe në përputhje me legjislacionin e përgjithshëm sipas Nenit 7, Paragrafi 1, i Ligjit gjerman të Mediave Telematike (TMG). Megjithatë, sipas Neneve 8 deri 10 TMG, ne nuk jemi të detyruar të monitorojmë informacionet e transmetuara ose të ruajtura nga palët e treta.</p>

<h3>Përgjegjësia për lidhjet</h3>
<p>Faqja jonë e internetit përmban lidhje me faqe të jashtme të palëve të treta mbi përmbajtjen e të cilave nuk kemi asnjë ndikim. Prandaj, ne nuk mund të pranojmë asnjë përgjegjësi për këtë përmbajtje të palëve të treta.</p>

<h3>E drejta e autorit</h3>
<p>Përmbajtja dhe veprat e krijuara nga operatorët e faqes në këto faqe i nënshtrohen ligjit gjerman të së drejtës së autorit. Riprodhimi, përpunimi, shpërndarja dhe çdo formë e komercializimit të këtij materiali përtej fushës së së drejtës së autorit kërkojnë pëlqimin paraprak me shkrim të autorit ose krijuesit përkatës.</p>`;

// ─────────────────────────────────────────────────────────────
// PRIVACY (Datenschutz)
// ─────────────────────────────────────────────────────────────

const privacy_de = `<h2>Datenschutzerklärung</h2>

<h3>1. Datenschutz auf einen Blick</h3>
<p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>

<h3>2. Verantwortliche Stelle</h3>
<p><strong>gjej-pune UG (haftungsbeschränkt)</strong><br>
Musterstraße 1<br>
10115 Berlin, Deutschland<br>
E-Mail: datenschutz@gjej-pune.com</p>

<h3>3. Datenerfassung auf unserer Website</h3>

<h4>3.1 Registrierung</h4>
<p>Bei der Registrierung erheben wir:</p>
<ul>
<li>E-Mail-Adresse (Pflichtfeld)</li>
<li>Passwort (verschlüsselt gespeichert)</li>
<li>Name / Anzeigename</li>
<li>Rolle (Arbeitssuchender oder Arbeitgeber)</li>
</ul>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</p>

<h4>3.2 Nutzung der Plattform</h4>
<p>Bei der Nutzung verarbeiten wir:</p>
<ul>
<li><strong>Arbeitssuchende:</strong> Profilinformationen, Berufserfahrung, Kontaktdaten, Standort</li>
<li><strong>Arbeitgeber:</strong> Unternehmensinformationen, Stellenausschreibungen, Kontaktdaten</li>
<li><strong>Alle Nutzer:</strong> Nachrichten, Favoriten, Bewerbungshistorie</li>
</ul>

<h4>3.3 Server-Log-Dateien</h4>
<p>Automatisch erhobene Daten:</p>
<ul>
<li>Browsertyp und -version</li>
<li>Betriebssystem</li>
<li>Referrer URL</li>
<li>IP-Adresse</li>
<li>Uhrzeit der Anfrage</li>
</ul>

<h4>3.4 Cookies</h4>
<p>Wir verwenden:</p>
<ul>
<li><strong>Technisch notwendige Cookies:</strong> Session-Management, Authentifizierung</li>
<li><strong>Sprach-Cookies:</strong> Speicherung Ihrer bevorzugten Sprache</li>
</ul>

<h3>4. Zweck der Datenverarbeitung</h3>
<ul>
<li>Bereitstellung der Jobvermittlungsplattform</li>
<li>Verwaltung Ihres Benutzerkontos</li>
<li>Vermittlung zwischen Arbeitssuchenden und Arbeitgebern</li>
<li>Kommunikation über die Messaging-Funktion</li>
<li>Verbesserung unserer Dienstleistungen</li>
<li>Gewährleistung der Sicherheit</li>
</ul>

<h3>5. Speicherdauer</h3>
<p>Ihre Daten werden gespeichert, solange Ihr Konto aktiv ist. Nach Löschung werden alle Daten innerhalb von 30 Tagen entfernt, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</p>

<h3>6. Ihre Rechte</h3>
<ul>
<li><strong>Auskunft</strong> (Art. 15 DSGVO)</li>
<li><strong>Berichtigung</strong> (Art. 16 DSGVO)</li>
<li><strong>Löschung</strong> (Art. 17 DSGVO)</li>
<li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
<li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
<li><strong>Widerspruch</strong> (Art. 21 DSGVO)</li>
<li><strong>Beschwerde bei einer Aufsichtsbehörde</strong> (Art. 77 DSGVO)</li>
</ul>

<h3>7. Datensicherheit</h3>
<p>Wir verwenden SSL-Verschlüsselung und speichern Passwörter ausschließlich in verschlüsselter Form (bcrypt).</p>

<h3>8. Kontakt</h3>
<p>E-Mail: datenschutz@gjej-pune.com</p>`;

const privacy_en = `<h2>Privacy Policy</h2>

<h3>1. Privacy at a Glance</h3>
<p>The following information provides a simple overview of what happens to your personal data when you visit our website. Personal data is any data that can be used to personally identify you.</p>

<h3>2. Responsible Party</h3>
<p><strong>gjej-pune UG (limited liability)</strong><br>
Musterstraße 1<br>
10115 Berlin, Germany<br>
Email: privacy@gjej-pune.com</p>

<h3>3. Data Collection on Our Website</h3>

<h4>3.1 Registration</h4>
<p>When you register, we collect:</p>
<ul>
<li>Email address (required)</li>
<li>Password (stored encrypted)</li>
<li>Name / display name</li>
<li>Role (job seeker or employer)</li>
</ul>
<p><strong>Legal basis:</strong> Art. 6(1)(b) GDPR (contract performance) and Art. 6(1)(a) GDPR (consent).</p>

<h4>3.2 Platform Usage</h4>
<p>When using the platform, we process:</p>
<ul>
<li><strong>Job seekers:</strong> Profile information, work experience, contact details, location</li>
<li><strong>Employers:</strong> Company information, job postings, contact details</li>
<li><strong>All users:</strong> Messages, favorites, application history</li>
</ul>

<h4>3.3 Server Log Files</h4>
<p>Automatically collected data:</p>
<ul>
<li>Browser type and version</li>
<li>Operating system</li>
<li>Referrer URL</li>
<li>IP address</li>
<li>Time of request</li>
</ul>

<h4>3.4 Cookies</h4>
<p>We use:</p>
<ul>
<li><strong>Technically necessary cookies:</strong> Session management, authentication</li>
<li><strong>Language cookies:</strong> Storing your preferred language</li>
</ul>

<h3>4. Purpose of Data Processing</h3>
<ul>
<li>Providing the job matching platform</li>
<li>Managing your user account</li>
<li>Matching job seekers with employers</li>
<li>Communication via the messaging function</li>
<li>Improving our services</li>
<li>Ensuring platform security</li>
</ul>

<h3>5. Storage Duration</h3>
<p>Your data is stored as long as your account is active. After account deletion, all data will be removed within 30 days, unless legal retention obligations apply.</p>

<h3>6. Your Rights</h3>
<ul>
<li><strong>Access</strong> (Art. 15 GDPR)</li>
<li><strong>Rectification</strong> (Art. 16 GDPR)</li>
<li><strong>Erasure</strong> (Art. 17 GDPR)</li>
<li><strong>Restriction of processing</strong> (Art. 18 GDPR)</li>
<li><strong>Data portability</strong> (Art. 20 GDPR)</li>
<li><strong>Objection</strong> (Art. 21 GDPR)</li>
<li><strong>Complaint to a supervisory authority</strong> (Art. 77 GDPR)</li>
</ul>

<h3>7. Data Security</h3>
<p>We use SSL encryption and store passwords exclusively in encrypted form (bcrypt).</p>

<h3>8. Contact</h3>
<p>Email: privacy@gjej-pune.com</p>`;

const privacy_fr = `<h2>Politique de confidentialité</h2>

<h3>1. Protection des données en bref</h3>
<p>Les indications suivantes donnent un aperçu simple de ce qui arrive à vos données personnelles lorsque vous visitez notre site web. Les données personnelles sont toutes les données qui permettent de vous identifier personnellement.</p>

<h3>2. Responsable</h3>
<p><strong>gjej-pune UG (à responsabilité limitée)</strong><br>
Musterstraße 1<br>
10115 Berlin, Allemagne<br>
E-mail : confidentialite@gjej-pune.com</p>

<h3>3. Collecte de données sur notre site web</h3>

<h4>3.1 Inscription</h4>
<p>Lors de l'inscription, nous collectons :</p>
<ul>
<li>Adresse e-mail (obligatoire)</li>
<li>Mot de passe (stocké de manière cryptée)</li>
<li>Nom / nom d'affichage</li>
<li>Rôle (demandeur d'emploi ou employeur)</li>
</ul>
<p><strong>Base juridique :</strong> Art. 6, par. 1, let. b RGPD (exécution du contrat) et Art. 6, par. 1, let. a RGPD (consentement).</p>

<h4>3.2 Utilisation de la plateforme</h4>
<p>Lors de l'utilisation, nous traitons :</p>
<ul>
<li><strong>Demandeurs d'emploi :</strong> Informations de profil, expérience professionnelle, coordonnées, localisation</li>
<li><strong>Employeurs :</strong> Informations sur l'entreprise, offres d'emploi, coordonnées</li>
<li><strong>Tous les utilisateurs :</strong> Messages, favoris, historique des candidatures</li>
</ul>

<h4>3.3 Fichiers journaux du serveur</h4>
<p>Données collectées automatiquement :</p>
<ul>
<li>Type et version du navigateur</li>
<li>Système d'exploitation</li>
<li>URL de référence</li>
<li>Adresse IP</li>
<li>Heure de la requête</li>
</ul>

<h4>3.4 Cookies</h4>
<p>Nous utilisons :</p>
<ul>
<li><strong>Cookies techniquement nécessaires :</strong> Gestion de session, authentification</li>
<li><strong>Cookies de langue :</strong> Mémorisation de votre langue préférée</li>
</ul>

<h3>4. Finalité du traitement des données</h3>
<ul>
<li>Fourniture de la plateforme de mise en relation professionnelle</li>
<li>Gestion de votre compte utilisateur</li>
<li>Mise en relation entre demandeurs d'emploi et employeurs</li>
<li>Communication via la fonction de messagerie</li>
<li>Amélioration de nos services</li>
<li>Garantie de la sécurité</li>
</ul>

<h3>5. Durée de conservation</h3>
<p>Vos données sont conservées tant que votre compte est actif. Après suppression, toutes les données seront effacées dans un délai de 30 jours, sauf obligations légales de conservation.</p>

<h3>6. Vos droits</h3>
<ul>
<li><strong>Accès</strong> (Art. 15 RGPD)</li>
<li><strong>Rectification</strong> (Art. 16 RGPD)</li>
<li><strong>Effacement</strong> (Art. 17 RGPD)</li>
<li><strong>Limitation du traitement</strong> (Art. 18 RGPD)</li>
<li><strong>Portabilité des données</strong> (Art. 20 RGPD)</li>
<li><strong>Opposition</strong> (Art. 21 RGPD)</li>
<li><strong>Réclamation auprès d'une autorité de contrôle</strong> (Art. 77 RGPD)</li>
</ul>

<h3>7. Sécurité des données</h3>
<p>Nous utilisons le cryptage SSL et stockons les mots de passe exclusivement sous forme cryptée (bcrypt).</p>

<h3>8. Contact</h3>
<p>E-mail : confidentialite@gjej-pune.com</p>`;

const privacy_it = `<h2>Informativa sulla privacy</h2>

<h3>1. Privacy in breve</h3>
<p>Le seguenti informazioni forniscono una panoramica semplice di ciò che accade ai vostri dati personali quando visitate il nostro sito web. I dati personali sono tutti i dati che possono essere utilizzati per identificarvi personalmente.</p>

<h3>2. Responsabile</h3>
<p><strong>gjej-pune UG (a responsabilità limitata)</strong><br>
Musterstraße 1<br>
10115 Berlino, Germania<br>
E-mail: privacy@gjej-pune.com</p>

<h3>3. Raccolta dati sul nostro sito web</h3>

<h4>3.1 Registrazione</h4>
<p>Al momento della registrazione raccogliamo:</p>
<ul>
<li>Indirizzo e-mail (obbligatorio)</li>
<li>Password (memorizzata in forma crittografata)</li>
<li>Nome / nome visualizzato</li>
<li>Ruolo (cercatore di lavoro o datore di lavoro)</li>
</ul>
<p><strong>Base giuridica:</strong> Art. 6, par. 1, let. b GDPR (esecuzione del contratto) e Art. 6, par. 1, let. a GDPR (consenso).</p>

<h4>3.2 Utilizzo della piattaforma</h4>
<p>Durante l'utilizzo elaboriamo:</p>
<ul>
<li><strong>Cercatori di lavoro:</strong> Informazioni del profilo, esperienza lavorativa, dati di contatto, posizione</li>
<li><strong>Datori di lavoro:</strong> Informazioni aziendali, offerte di lavoro, dati di contatto</li>
<li><strong>Tutti gli utenti:</strong> Messaggi, preferiti, storico delle candidature</li>
</ul>

<h4>3.3 File di log del server</h4>
<p>Dati raccolti automaticamente:</p>
<ul>
<li>Tipo e versione del browser</li>
<li>Sistema operativo</li>
<li>URL di riferimento</li>
<li>Indirizzo IP</li>
<li>Ora della richiesta</li>
</ul>

<h4>3.4 Cookie</h4>
<p>Utilizziamo:</p>
<ul>
<li><strong>Cookie tecnicamente necessari:</strong> Gestione della sessione, autenticazione</li>
<li><strong>Cookie di lingua:</strong> Memorizzazione della lingua preferita</li>
</ul>

<h3>4. Finalità del trattamento dei dati</h3>
<ul>
<li>Fornitura della piattaforma di matching lavorativo</li>
<li>Gestione dell'account utente</li>
<li>Collegamento tra cercatori di lavoro e datori di lavoro</li>
<li>Comunicazione tramite la funzione di messaggistica</li>
<li>Miglioramento dei nostri servizi</li>
<li>Garanzia della sicurezza</li>
</ul>

<h3>5. Durata della conservazione</h3>
<p>I vostri dati vengono conservati finché il vostro account è attivo. Dopo la cancellazione, tutti i dati saranno rimossi entro 30 giorni, salvo obblighi legali di conservazione.</p>

<h3>6. I vostri diritti</h3>
<ul>
<li><strong>Accesso</strong> (Art. 15 GDPR)</li>
<li><strong>Rettifica</strong> (Art. 16 GDPR)</li>
<li><strong>Cancellazione</strong> (Art. 17 GDPR)</li>
<li><strong>Limitazione del trattamento</strong> (Art. 18 GDPR)</li>
<li><strong>Portabilità dei dati</strong> (Art. 20 GDPR)</li>
<li><strong>Opposizione</strong> (Art. 21 GDPR)</li>
<li><strong>Reclamo presso un'autorità di controllo</strong> (Art. 77 GDPR)</li>
</ul>

<h3>7. Sicurezza dei dati</h3>
<p>Utilizziamo la crittografia SSL e memorizziamo le password esclusivamente in forma crittografata (bcrypt).</p>

<h3>8. Contatto</h3>
<p>E-mail: privacy@gjej-pune.com</p>`;

const privacy_sq = `<h2>Politika e privatësisë</h2>

<h3>1. Privatësia me një shikim</h3>
<p>Informacionet e mëposhtme ofrojnë një pasqyrë të thjeshtë të asaj që ndodh me të dhënat tuaja personale kur vizitoni faqen tonë të internetit. Të dhënat personale janë të gjitha të dhënat që mund të përdoren për t'ju identifikuar personalisht.</p>

<h3>2. Pala përgjegjëse</h3>
<p><strong>gjej-pune UG (me përgjegjësi të kufizuar)</strong><br>
Musterstraße 1<br>
10115 Berlin, Gjermani<br>
E-mail: privatesia@gjej-pune.com</p>

<h3>3. Mbledhja e të dhënave në faqen tonë</h3>

<h4>3.1 Regjistrimi</h4>
<p>Gjatë regjistrimit mbledhim:</p>
<ul>
<li>Adresën e e-mailit (e detyrueshme)</li>
<li>Fjalëkalimin (i ruajtur i enkriptuar)</li>
<li>Emrin / emrin e shfaqur</li>
<li>Rolin (kërkues pune ose punëdhënës)</li>
</ul>
<p><strong>Baza ligjore:</strong> Neni 6(1)(b) GDPR (përmbushja e kontratës) dhe Neni 6(1)(a) GDPR (pëlqimi).</p>

<h4>3.2 Përdorimi i platformës</h4>
<p>Gjatë përdorimit përpunojmë:</p>
<ul>
<li><strong>Kërkuesit e punës:</strong> Informacionet e profilit, përvojën e punës, të dhënat e kontaktit, vendndodhjen</li>
<li><strong>Punëdhënësit:</strong> Informacionet e kompanisë, shpalljet e punës, të dhënat e kontaktit</li>
<li><strong>Të gjithë përdoruesit:</strong> Mesazhet, të preferuarat, historinë e aplikimeve</li>
</ul>

<h4>3.3 Skedarët e regjistrit të serverit</h4>
<p>Të dhënat e mbledhura automatikisht:</p>
<ul>
<li>Lloji dhe versioni i shfletuesit</li>
<li>Sistemi operativ</li>
<li>URL referuese</li>
<li>Adresa IP</li>
<li>Koha e kërkesës</li>
</ul>

<h4>3.4 Cookie-t</h4>
<p>Ne përdorim:</p>
<ul>
<li><strong>Cookie-t teknikisht të nevojshme:</strong> Menaxhimi i seancës, autentifikimi</li>
<li><strong>Cookie-t e gjuhës:</strong> Ruajtja e gjuhës suaj të preferuar</li>
</ul>

<h3>4. Qëllimi i përpunimit të të dhënave</h3>
<ul>
<li>Ofrimi i platformës së ndërmjetësimit të punës</li>
<li>Menaxhimi i llogarisë suaj</li>
<li>Ndërmjetësimi midis kërkuesve të punës dhe punëdhënësve</li>
<li>Komunikimi përmes funksionit të mesazhimit</li>
<li>Përmirësimi i shërbimeve tona</li>
<li>Sigurimi i sigurisë së platformës</li>
</ul>

<h3>5. Kohëzgjatja e ruajtjes</h3>
<p>Të dhënat tuaja ruhen sa kohë që llogaria juaj është aktive. Pas fshirjes, të gjitha të dhënat do të hiqen brenda 30 ditëve, përveç nëse zbatohen detyrime ligjore ruajtjeje.</p>

<h3>6. Të drejtat tuaja</h3>
<ul>
<li><strong>Qasja</strong> (Neni 15 GDPR)</li>
<li><strong>Korrigjimi</strong> (Neni 16 GDPR)</li>
<li><strong>Fshirja</strong> (Neni 17 GDPR)</li>
<li><strong>Kufizimi i përpunimit</strong> (Neni 18 GDPR)</li>
<li><strong>Transportueshmëria e të dhënave</strong> (Neni 20 GDPR)</li>
<li><strong>Kundërshtimi</strong> (Neni 21 GDPR)</li>
<li><strong>Ankesa te një autoritet mbikëqyrës</strong> (Neni 77 GDPR)</li>
</ul>

<h3>7. Siguria e të dhënave</h3>
<p>Ne përdorim enkriptimin SSL dhe ruajmë fjalëkalimet ekskluzivisht në formë të enkriptuar (bcrypt).</p>

<h3>8. Kontakti</h3>
<p>E-mail: privatesia@gjej-pune.com</p>`;

// ─────────────────────────────────────────────────────────────
// TERMS (AGB)
// ─────────────────────────────────────────────────────────────

const terms_de = `<h2>Allgemeine Geschäftsbedingungen (AGB)</h2>

<h3>§ 1 Geltungsbereich</h3>
<p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Online-Plattform gjej-pune.com (nachfolgend „Plattform"), betrieben von der gjej-pune UG (haftungsbeschränkt), Musterstraße 1, 10115 Berlin (nachfolgend „Betreiber").</p>
<p>Durch die Registrierung und Nutzung der Plattform erklärt sich der Nutzer mit diesen AGB einverstanden.</p>

<h3>§ 2 Leistungsbeschreibung</h3>
<p>gjej-pune.com ist eine Jobvermittlungsplattform, die folgende Dienste anbietet:</p>
<ul>
<li><strong>Für Arbeitssuchende:</strong> Erstellung eines Profils, Suche nach Stellenangeboten, Kontaktaufnahme mit Arbeitgebern, Speichern von Favoriten</li>
<li><strong>Für Arbeitgeber:</strong> Erstellung und Verwaltung von Stellenangeboten, Suche nach Kandidaten, Kontaktaufnahme über die Messaging-Funktion</li>
<li><strong>Allgemein:</strong> Mehrsprachige Unterstützung (DE, EN, FR, IT, SQ), sichere Nachrichtenübermittlung</li>
</ul>
<p>Die Plattform dient ausschließlich der Vermittlung. Der Betreiber ist kein Vertragspartner bei Arbeitsverträgen.</p>

<h3>§ 3 Registrierung und Benutzerkonto</h3>
<ol>
<li>Die Nutzung erfordert eine Registrierung mit gültiger E-Mail-Adresse und Passwort.</li>
<li>Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und Daten aktuell zu halten.</li>
<li>Zugangsdaten sind vertraulich zu behandeln. Der Nutzer haftet für alle Aktivitäten unter seinem Konto.</li>
<li>Pro Person ist nur ein Benutzerkonto gestattet.</li>
</ol>

<h3>§ 4 Pflichten der Nutzer</h3>
<p>Der Nutzer verpflichtet sich:</p>
<ul>
<li>Keine falschen oder irreführenden Informationen zu veröffentlichen</li>
<li>Die Plattform nicht für rechtswidrige Zwecke zu nutzen</li>
<li>Keine diskriminierenden oder beleidigenden Inhalte einzustellen</li>
<li>Die Rechte Dritter zu respektieren</li>
<li>Keine Spam-Nachrichten zu versenden</li>
<li>Kontaktdaten anderer Nutzer nicht außerhalb der Plattform zu verwenden</li>
</ul>

<h3>§ 5 Inhalte und Verantwortung</h3>
<ol>
<li>Der Nutzer ist für alle von ihm eingestellten Inhalte selbst verantwortlich.</li>
<li>Der Betreiber behält sich das Recht vor, Inhalte bei Verstößen zu entfernen.</li>
<li>Der Betreiber übernimmt keine Gewähr für die Richtigkeit der Nutzerinhalte.</li>
</ol>

<h3>§ 6 Haftungsbeschränkung</h3>
<ol>
<li>Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.</li>
<li>Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten.</li>
<li>Der Betreiber haftet nicht für die Qualität vermittelter Arbeitsverhältnisse.</li>
<li>Keine Garantie für ununterbrochene Verfügbarkeit der Plattform.</li>
</ol>

<h3>§ 7 Kündigung und Kontolöschung</h3>
<ol>
<li>Der Nutzer kann sein Konto jederzeit löschen.</li>
<li>Der Betreiber kann Konten bei Verstößen sperren oder löschen.</li>
<li>Nach Löschung werden alle Daten innerhalb von 30 Tagen entfernt.</li>
</ol>

<h3>§ 8 Änderungen der AGB</h3>
<p>Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Nutzer werden über Änderungen informiert. Die geänderten AGB gelten als angenommen, wenn nicht innerhalb von 14 Tagen widersprochen wird.</p>

<h3>§ 9 Schlussbestimmungen</h3>
<ol>
<li>Es gilt das Recht der Bundesrepublik Deutschland.</li>
<li>Gerichtsstand ist Berlin, sofern der Nutzer Kaufmann ist.</li>
<li>Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen unberührt.</li>
</ol>

<p><em>Stand: Januar 2025</em></p>`;

const terms_en = `<h2>Terms and Conditions</h2>

<h3>§ 1 Scope</h3>
<p>These Terms and Conditions apply to the use of the online platform gjej-pune.com (hereinafter "Platform"), operated by gjej-pune UG (limited liability), Musterstraße 1, 10115 Berlin (hereinafter "Operator").</p>
<p>By registering and using the Platform, the user agrees to these Terms and Conditions.</p>

<h3>§ 2 Service Description</h3>
<p>gjej-pune.com is a job matching platform that offers the following services:</p>
<ul>
<li><strong>For job seekers:</strong> Creating a profile, searching for job offers, contacting employers, saving favorites</li>
<li><strong>For employers:</strong> Creating and managing job offers, searching for candidates, contacting via the messaging function</li>
<li><strong>General:</strong> Multilingual support (DE, EN, FR, IT, SQ), secure messaging</li>
</ul>
<p>The Platform serves exclusively as an intermediary. The Operator is not a contractual party in employment contracts.</p>

<h3>§ 3 Registration and User Account</h3>
<ol>
<li>Usage requires registration with a valid email address and password.</li>
<li>The user is obligated to provide truthful information and keep data up to date.</li>
<li>Login credentials must be kept confidential. The user is liable for all activities under their account.</li>
<li>Only one user account per person is permitted.</li>
</ol>

<h3>§ 4 User Obligations</h3>
<p>The user agrees to:</p>
<ul>
<li>Not publish false or misleading information</li>
<li>Not use the platform for unlawful purposes</li>
<li>Not post discriminatory or offensive content</li>
<li>Respect the rights of third parties</li>
<li>Not send spam messages</li>
<li>Not use other users' contact details outside the platform</li>
</ul>

<h3>§ 5 Content and Responsibility</h3>
<ol>
<li>The user is solely responsible for all content they post.</li>
<li>The Operator reserves the right to remove content that violates these Terms.</li>
<li>The Operator does not guarantee the accuracy of user-generated content.</li>
</ol>

<h3>§ 6 Limitation of Liability</h3>
<ol>
<li>The Operator is fully liable for intentional misconduct and gross negligence.</li>
<li>For slight negligence, the Operator is only liable for breach of essential contractual obligations.</li>
<li>The Operator is not liable for the quality of brokered employment relationships.</li>
<li>No guarantee of uninterrupted platform availability.</li>
</ol>

<h3>§ 7 Termination and Account Deletion</h3>
<ol>
<li>The user can delete their account at any time.</li>
<li>The Operator may suspend or delete accounts in case of violations.</li>
<li>After deletion, all data will be removed within 30 days.</li>
</ol>

<h3>§ 8 Changes to Terms</h3>
<p>The Operator reserves the right to change these Terms at any time. Users will be notified of changes. The amended Terms are deemed accepted unless objection is raised within 14 days.</p>

<h3>§ 9 Final Provisions</h3>
<ol>
<li>The laws of the Federal Republic of Germany apply.</li>
<li>Place of jurisdiction is Berlin, insofar as the user is a merchant.</li>
<li>Should individual provisions be invalid, the validity of the remaining provisions remains unaffected.</li>
</ol>

<p><em>Last updated: January 2025</em></p>`;

const terms_fr = `<h2>Conditions générales d'utilisation (CGU)</h2>

<h3>§ 1 Champ d'application</h3>
<p>Les présentes Conditions générales d'utilisation s'appliquent à l'utilisation de la plateforme en ligne gjej-pune.com (ci-après « Plateforme »), exploitée par gjej-pune UG (à responsabilité limitée), Musterstraße 1, 10115 Berlin (ci-après « Exploitant »).</p>
<p>En s'inscrivant et en utilisant la Plateforme, l'utilisateur accepte les présentes CGU.</p>

<h3>§ 2 Description des services</h3>
<p>gjej-pune.com est une plateforme de mise en relation professionnelle qui offre les services suivants :</p>
<ul>
<li><strong>Pour les demandeurs d'emploi :</strong> Création d'un profil, recherche d'offres d'emploi, prise de contact avec les employeurs, sauvegarde de favoris</li>
<li><strong>Pour les employeurs :</strong> Création et gestion d'offres d'emploi, recherche de candidats, contact via la messagerie</li>
<li><strong>Général :</strong> Support multilingue (DE, EN, FR, IT, SQ), messagerie sécurisée</li>
</ul>
<p>La Plateforme sert exclusivement d'intermédiaire. L'Exploitant n'est pas partie aux contrats de travail.</p>

<h3>§ 3 Inscription et compte utilisateur</h3>
<ol>
<li>L'utilisation nécessite une inscription avec une adresse e-mail valide et un mot de passe.</li>
<li>L'utilisateur est tenu de fournir des informations véridiques et de les maintenir à jour.</li>
<li>Les identifiants de connexion doivent être traités de manière confidentielle.</li>
<li>Un seul compte utilisateur par personne est autorisé.</li>
</ol>

<h3>§ 4 Obligations des utilisateurs</h3>
<p>L'utilisateur s'engage à :</p>
<ul>
<li>Ne pas publier d'informations fausses ou trompeuses</li>
<li>Ne pas utiliser la plateforme à des fins illégales</li>
<li>Ne pas publier de contenu discriminatoire ou offensant</li>
<li>Respecter les droits des tiers</li>
<li>Ne pas envoyer de messages indésirables (spam)</li>
<li>Ne pas utiliser les coordonnées d'autres utilisateurs en dehors de la plateforme</li>
</ul>

<h3>§ 5 Contenu et responsabilité</h3>
<ol>
<li>L'utilisateur est seul responsable de tout contenu qu'il publie.</li>
<li>L'Exploitant se réserve le droit de supprimer tout contenu en violation des CGU.</li>
<li>L'Exploitant ne garantit pas l'exactitude du contenu généré par les utilisateurs.</li>
</ol>

<h3>§ 6 Limitation de responsabilité</h3>
<ol>
<li>L'Exploitant est pleinement responsable en cas de faute intentionnelle et de négligence grave.</li>
<li>En cas de négligence légère, la responsabilité est limitée aux obligations contractuelles essentielles.</li>
<li>L'Exploitant n'est pas responsable de la qualité des relations de travail intermédiées.</li>
<li>Aucune garantie de disponibilité ininterrompue de la plateforme.</li>
</ol>

<h3>§ 7 Résiliation et suppression de compte</h3>
<ol>
<li>L'utilisateur peut supprimer son compte à tout moment.</li>
<li>L'Exploitant peut suspendre ou supprimer des comptes en cas de violations.</li>
<li>Après suppression, toutes les données seront effacées dans un délai de 30 jours.</li>
</ol>

<h3>§ 8 Modifications des CGU</h3>
<p>L'Exploitant se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications. Les CGU modifiées sont réputées acceptées si aucune objection n'est soulevée dans les 14 jours.</p>

<h3>§ 9 Dispositions finales</h3>
<ol>
<li>Le droit de la République fédérale d'Allemagne s'applique.</li>
<li>Le tribunal compétent est Berlin, dans la mesure où l'utilisateur est commerçant.</li>
<li>Si certaines dispositions sont invalides, la validité des autres dispositions n'est pas affectée.</li>
</ol>

<p><em>Dernière mise à jour : janvier 2025</em></p>`;

const terms_it = `<h2>Termini e condizioni generali</h2>

<h3>§ 1 Ambito di applicazione</h3>
<p>I presenti Termini e condizioni generali si applicano all'utilizzo della piattaforma online gjej-pune.com (di seguito "Piattaforma"), gestita da gjej-pune UG (a responsabilità limitata), Musterstraße 1, 10115 Berlino (di seguito "Gestore").</p>
<p>Con la registrazione e l'utilizzo della Piattaforma, l'utente accetta i presenti Termini e condizioni.</p>

<h3>§ 2 Descrizione del servizio</h3>
<p>gjej-pune.com è una piattaforma di matching lavorativo che offre i seguenti servizi:</p>
<ul>
<li><strong>Per i cercatori di lavoro:</strong> Creazione di un profilo, ricerca di offerte di lavoro, contatto con i datori di lavoro, salvataggio dei preferiti</li>
<li><strong>Per i datori di lavoro:</strong> Creazione e gestione di offerte di lavoro, ricerca di candidati, contatto tramite messaggistica</li>
<li><strong>Generale:</strong> Supporto multilingue (DE, EN, FR, IT, SQ), messaggistica sicura</li>
</ul>
<p>La Piattaforma funge esclusivamente da intermediario. Il Gestore non è parte contrattuale nei contratti di lavoro.</p>

<h3>§ 3 Registrazione e account utente</h3>
<ol>
<li>L'utilizzo richiede la registrazione con un indirizzo e-mail valido e una password.</li>
<li>L'utente è obbligato a fornire informazioni veritiere e a mantenerle aggiornate.</li>
<li>Le credenziali di accesso devono essere trattate in modo confidenziale.</li>
<li>È consentito un solo account utente per persona.</li>
</ol>

<h3>§ 4 Obblighi degli utenti</h3>
<p>L'utente si impegna a:</p>
<ul>
<li>Non pubblicare informazioni false o fuorvianti</li>
<li>Non utilizzare la piattaforma per scopi illegali</li>
<li>Non pubblicare contenuti discriminatori o offensivi</li>
<li>Rispettare i diritti di terzi</li>
<li>Non inviare messaggi di spam</li>
<li>Non utilizzare i dati di contatto di altri utenti al di fuori della piattaforma</li>
</ul>

<h3>§ 5 Contenuti e responsabilità</h3>
<ol>
<li>L'utente è l'unico responsabile di tutti i contenuti che pubblica.</li>
<li>Il Gestore si riserva il diritto di rimuovere contenuti che violano i presenti Termini.</li>
<li>Il Gestore non garantisce l'accuratezza dei contenuti generati dagli utenti.</li>
</ol>

<h3>§ 6 Limitazione di responsabilità</h3>
<ol>
<li>Il Gestore è pienamente responsabile per dolo e colpa grave.</li>
<li>Per colpa lieve, la responsabilità è limitata alla violazione degli obblighi contrattuali essenziali.</li>
<li>Il Gestore non è responsabile per la qualità dei rapporti di lavoro intermediati.</li>
<li>Nessuna garanzia di disponibilità ininterrotta della piattaforma.</li>
</ol>

<h3>§ 7 Recesso e cancellazione dell'account</h3>
<ol>
<li>L'utente può cancellare il proprio account in qualsiasi momento.</li>
<li>Il Gestore può sospendere o cancellare account in caso di violazioni.</li>
<li>Dopo la cancellazione, tutti i dati saranno rimossi entro 30 giorni.</li>
</ol>

<h3>§ 8 Modifiche dei Termini</h3>
<p>Il Gestore si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Gli utenti saranno informati delle modifiche. I Termini modificati si considerano accettati se non viene sollevata obiezione entro 14 giorni.</p>

<h3>§ 9 Disposizioni finali</h3>
<ol>
<li>Si applica il diritto della Repubblica Federale di Germania.</li>
<li>Il foro competente è Berlino, nella misura in cui l'utente è un commerciante.</li>
<li>Qualora singole disposizioni risultino invalide, la validità delle restanti disposizioni non ne è pregiudicata.</li>
</ol>

<p><em>Ultimo aggiornamento: gennaio 2025</em></p>`;

const terms_sq = `<h2>Kushtet e përgjithshme të përdorimit</h2>

<h3>§ 1 Fusha e zbatimit</h3>
<p>Këto Kushte të përgjithshme zbatohen për përdorimin e platformës online gjej-pune.com (në vijim "Platforma"), e operuar nga gjej-pune UG (me përgjegjësi të kufizuar), Musterstraße 1, 10115 Berlin (në vijim "Operatori").</p>
<p>Duke u regjistruar dhe përdorur Platformën, përdoruesi pranon këto Kushte.</p>

<h3>§ 2 Përshkrimi i shërbimit</h3>
<p>gjej-pune.com është një platformë ndërmjetësimi pune që ofron shërbimet e mëposhtme:</p>
<ul>
<li><strong>Për kërkuesit e punës:</strong> Krijimi i një profili, kërkimi i ofertave të punës, kontaktimi i punëdhënësve, ruajtja e të preferuarave</li>
<li><strong>Për punëdhënësit:</strong> Krijimi dhe menaxhimi i ofertave të punës, kërkimi i kandidatëve, kontaktimi përmes mesazhimit</li>
<li><strong>Përgjithshëm:</strong> Mbështetje shumëgjuhëshe (DE, EN, FR, IT, SQ), mesazhim i sigurt</li>
</ul>
<p>Platforma shërben ekskluzivisht si ndërmjetëse. Operatori nuk është palë kontraktore në kontratat e punës.</p>

<h3>§ 3 Regjistrimi dhe llogaria e përdoruesit</h3>
<ol>
<li>Përdorimi kërkon regjistrim me një adresë e-mail të vlefshme dhe fjalëkalim.</li>
<li>Përdoruesi është i detyruar të japë informacione të vërteta dhe t'i mbajë të përditësuara.</li>
<li>Kredencialet e hyrjes duhet të trajtohen në mënyrë konfidenciale.</li>
<li>Lejohet vetëm një llogari përdoruesi për person.</li>
</ol>

<h3>§ 4 Detyrimet e përdoruesve</h3>
<p>Përdoruesi merr përsipër:</p>
<ul>
<li>Të mos publikojë informacione të rreme ose mashtruese</li>
<li>Të mos përdorë platformën për qëllime të paligjshme</li>
<li>Të mos publikojë përmbajtje diskriminuese ose ofenduese</li>
<li>Të respektojë të drejtat e palëve të treta</li>
<li>Të mos dërgojë mesazhe spam</li>
<li>Të mos përdorë të dhënat e kontaktit të përdoruesve të tjerë jashtë platformës</li>
</ul>

<h3>§ 5 Përmbajtja dhe përgjegjësia</h3>
<ol>
<li>Përdoruesi është vetëm përgjegjës për të gjithë përmbajtjen që publikon.</li>
<li>Operatori ruan të drejtën për të hequr përmbajtjen që shkel këto Kushte.</li>
<li>Operatori nuk garanton saktësinë e përmbajtjes së gjeneruar nga përdoruesit.</li>
</ol>

<h3>§ 6 Kufizimi i përgjegjësisë</h3>
<ol>
<li>Operatori është plotësisht përgjegjës për veprime të qëllimshme dhe neglizhencë të rëndë.</li>
<li>Për neglizhencë të lehtë, përgjegjësia kufizohet në shkeljen e detyrimeve thelbësore kontraktore.</li>
<li>Operatori nuk është përgjegjës për cilësinë e marrëdhënieve të punës të ndërmjetësuara.</li>
<li>Nuk ka garanci për disponueshmëri të pandërprerë të platformës.</li>
</ol>

<h3>§ 7 Përfundimi dhe fshirja e llogarisë</h3>
<ol>
<li>Përdoruesi mund të fshijë llogarinë e tij në çdo kohë.</li>
<li>Operatori mund të pezullojë ose fshijë llogaritë në rast shkeljesh.</li>
<li>Pas fshirjes, të gjitha të dhënat do të hiqen brenda 30 ditëve.</li>
</ol>

<h3>§ 8 Ndryshimet e kushteve</h3>
<p>Operatori ruan të drejtën për të ndryshuar këto Kushte në çdo kohë. Përdoruesit do të njoftohen për ndryshimet. Kushtet e ndryshuara konsiderohen të pranuara nëse nuk ngrihet kundërshtim brenda 14 ditëve.</p>

<h3>§ 9 Dispozitat përfundimtare</h3>
<ol>
<li>Zbatohet ligji i Republikës Federale të Gjermanisë.</li>
<li>Vendi i juridiksionit është Berlini, në masën që përdoruesi është tregtar.</li>
<li>Nëse dispozita individuale janë të pavlefshme, vlefshmëria e dispozitave të mbetura nuk ndikohet.</li>
</ol>

<p><em>Përditësimi i fundit: janar 2025</em></p>`;

// ─────────────────────────────────────────────────────────────
// SEED ALL
// ─────────────────────────────────────────────────────────────

const allLegal = [
  // Impressum
  { fieldKey: 'impressum', locale: 'de', value: impressum_de },
  { fieldKey: 'impressum', locale: 'en', value: impressum_en },
  { fieldKey: 'impressum', locale: 'fr', value: impressum_fr },
  { fieldKey: 'impressum', locale: 'it', value: impressum_it },
  { fieldKey: 'impressum', locale: 'sq', value: impressum_sq },
  // Privacy
  { fieldKey: 'privacy', locale: 'de', value: privacy_de },
  { fieldKey: 'privacy', locale: 'en', value: privacy_en },
  { fieldKey: 'privacy', locale: 'fr', value: privacy_fr },
  { fieldKey: 'privacy', locale: 'it', value: privacy_it },
  { fieldKey: 'privacy', locale: 'sq', value: privacy_sq },
  // Terms
  { fieldKey: 'terms', locale: 'de', value: terms_de },
  { fieldKey: 'terms', locale: 'en', value: terms_en },
  { fieldKey: 'terms', locale: 'fr', value: terms_fr },
  { fieldKey: 'terms', locale: 'it', value: terms_it },
  { fieldKey: 'terms', locale: 'sq', value: terms_sq },
];

async function main() {
  console.log('📜 Seeding legal texts (all languages)...\n');

  for (const item of allLegal) {
    await prisma.siteContent.upsert({
      where: {
        section_fieldKey_locale: {
          section: 'Legal',
          fieldKey: item.fieldKey,
          locale: item.locale,
        },
      },
      update: { value: item.value, type: 'richText' },
      create: {
        section: 'Legal',
        fieldKey: item.fieldKey,
        locale: item.locale,
        value: item.value,
        type: 'richText',
      },
    });
    console.log(`  ✅ ${item.fieldKey} [${item.locale}]`);
  }

  // Clean up old wrong keys (datenschutz, agb)
  for (const oldKey of ['datenschutz', 'agb']) {
    await prisma.siteContent.deleteMany({
      where: { section: 'Legal', fieldKey: oldKey },
    });
  }
  console.log('\n  🧹 Cleaned up old keys (datenschutz, agb)');

  console.log('\n✅ Legal texts seeded for all 5 languages!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
