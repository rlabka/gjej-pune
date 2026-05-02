/**
 * Country Name Resolution Tests
 *
 * Verifies that all country name variants (DE, EN, FR, IT, SQ)
 * correctly resolve to their ISO country codes.
 *
 * This covers the customer-reported bugs:
 * - "Zvicer" vs "Zvicra" (both = Schweiz/CH) returning different results
 * - "Italien" in Albanian (Itali) returning 0 results while German shows 6
 * - Diacritics variants (ë, è, ü, etc.) must match
 */

// ─── Reproduce the exact backend logic ─────────────────────

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const COUNTRY_NAME_TO_CODE: Record<string, string> = {};

const RAW_COUNTRY_NAMES: [string, string][] = [
  // DE
  ['Schweiz', 'CH'], ['Deutschland', 'DE'], ['Österreich', 'AT'], ['Albanien', 'AL'], ['Kosovo', 'XK'],
  ['Nordmazedonien', 'MK'], ['Italien', 'IT'], ['Frankreich', 'FR'], ['Spanien', 'ES'], ['Portugal', 'PT'],
  ['Serbien', 'RS'], ['Kroatien', 'HR'], ['Griechenland', 'GR'], ['Türkei', 'TR'], ['Niederlande', 'NL'],
  ['Holland', 'NL'], ['Belgien', 'BE'], ['Polen', 'PL'], ['Rumänien', 'RO'], ['Schweden', 'SE'], ['Norwegen', 'NO'],
  ['Finnland', 'FI'], ['Dänemark', 'DK'], ['Irland', 'IE'], ['Tschechien', 'CZ'], ['Slowakei', 'SK'],
  ['Ungarn', 'HU'], ['Bulgarien', 'BG'], ['Slowenien', 'SI'], ['Montenegro', 'ME'], ['Bosnien', 'BA'],
  ['Luxemburg', 'LU'], ['Liechtenstein', 'LI'], ['Zypern', 'CY'], ['Malta', 'MT'], ['Ukraine', 'UA'],
  ['Moldawien', 'MD'], ['Belarus', 'BY'], ['Weissrussland', 'BY'], ['Russland', 'RU'], ['Estland', 'EE'],
  ['Lettland', 'LV'], ['Litauen', 'LT'], ['Island', 'IS'], ['Grossbritannien', 'GB'],
  // EN
  ['Switzerland', 'CH'], ['Germany', 'DE'], ['Austria', 'AT'], ['Albania', 'AL'],
  ['Italy', 'IT'], ['France', 'FR'], ['Spain', 'ES'], ['Portugal', 'PT'],
  ['Serbia', 'RS'], ['Croatia', 'HR'], ['Greece', 'GR'], ['Turkey', 'TR'], ['Türkiye', 'TR'],
  ['Netherlands', 'NL'], ['Holland', 'NL'], ['Belgium', 'BE'], ['Poland', 'PL'], ['Romania', 'RO'],
  ['Sweden', 'SE'], ['Norway', 'NO'], ['Finland', 'FI'], ['Denmark', 'DK'], ['Ireland', 'IE'],
  ['Czech Republic', 'CZ'], ['Czechia', 'CZ'], ['Slovakia', 'SK'], ['Hungary', 'HU'], ['Bulgaria', 'BG'],
  ['Slovenia', 'SI'], ['Montenegro', 'ME'], ['Bosnia', 'BA'], ['Bosnia and Herzegovina', 'BA'],
  ['North Macedonia', 'MK'], ['Kosovo', 'XK'], ['Luxembourg', 'LU'], ['Liechtenstein', 'LI'],
  ['Cyprus', 'CY'], ['Malta', 'MT'], ['Ukraine', 'UA'], ['Moldova', 'MD'], ['Belarus', 'BY'],
  ['Russia', 'RU'], ['Estonia', 'EE'], ['Latvia', 'LV'], ['Lithuania', 'LT'], ['Iceland', 'IS'],
  ['United Kingdom', 'GB'], ['Great Britain', 'GB'],
  // FR
  ['Suisse', 'CH'], ['Allemagne', 'DE'], ['Autriche', 'AT'], ['Albanie', 'AL'],
  ['Italie', 'IT'], ['Espagne', 'ES'], ['Serbie', 'RS'], ['Croatie', 'HR'], ['Grèce', 'GR'],
  ['Turquie', 'TR'], ['Belgique', 'BE'], ['Pologne', 'PL'], ['Roumanie', 'RO'], ['Suède', 'SE'],
  ['Norvège', 'NO'], ['Finlande', 'FI'], ['Danemark', 'DK'], ['Irlande', 'IE'], ['Tchéquie', 'CZ'],
  ['Slovaquie', 'SK'], ['Hongrie', 'HU'], ['Bulgarie', 'BG'], ['Slovénie', 'SI'], ['Monténégro', 'ME'],
  ['Bosnie', 'BA'], ['Bosnie-Herzégovine', 'BA'], ['Macédoine du Nord', 'MK'],
  ['Pays-Bas', 'NL'], ['Chypre', 'CY'], ['Malte', 'MT'], ['Moldavie', 'MD'], ['Biélorussie', 'BY'],
  ['Russie', 'RU'], ['Estonie', 'EE'], ['Lettonie', 'LV'], ['Lituanie', 'LT'], ['Islande', 'IS'],
  ['Royaume-Uni', 'GB'],
  // IT
  ['Svizzera', 'CH'], ['Germania', 'DE'], ['Austria', 'AT'], ['Albania', 'AL'],
  ['Italia', 'IT'], ['Francia', 'FR'], ['Spagna', 'ES'], ['Portogallo', 'PT'],
  ['Serbia', 'RS'], ['Croazia', 'HR'], ['Grecia', 'GR'], ['Turchia', 'TR'], ['Paesi Bassi', 'NL'],
  ['Olanda', 'NL'], ['Belgio', 'BE'], ['Polonia', 'PL'], ['Romania', 'RO'], ['Svezia', 'SE'],
  ['Norvegia', 'NO'], ['Finlandia', 'FI'], ['Danimarca', 'DK'], ['Irlanda', 'IE'],
  ['Repubblica Ceca', 'CZ'], ['Slovacchia', 'SK'], ['Ungheria', 'HU'], ['Bulgaria', 'BG'],
  ['Slovenia', 'SI'], ['Montenegro', 'ME'], ['Bosnia', 'BA'], ['Bosnia ed Erzegovina', 'BA'],
  ['Macedonia del Nord', 'MK'], ['Cipro', 'CY'], ['Lussemburgo', 'LU'], ['Ucraina', 'UA'],
  ['Moldavia', 'MD'], ['Bielorussia', 'BY'], ['Russia', 'RU'], ['Estonia', 'EE'],
  ['Lettonia', 'LV'], ['Lituania', 'LT'], ['Islanda', 'IS'], ['Regno Unito', 'GB'],
  // SQ
  ['Zvicër', 'CH'], ['Zvicra', 'CH'], ['Zvicer', 'CH'],
  ['Gjermani', 'DE'], ['Gjermania', 'DE'],
  ['Austri', 'AT'], ['Austria', 'AT'],
  ['Shqipëri', 'AL'], ['Shqipëria', 'AL'], ['Shqiperi', 'AL'],
  ['Kosovë', 'XK'], ['Kosova', 'XK'],
  ['Maqedoni', 'MK'], ['Maqedonia', 'MK'],
  ['Itali', 'IT'], ['Italia', 'IT'],
  ['Francë', 'FR'], ['Franca', 'FR'], ['France', 'FR'],
  ['Spanjë', 'ES'], ['Spanja', 'ES'],
  ['Portugali', 'PT'], ['Portugalia', 'PT'],
  ['Serbi', 'RS'], ['Serbia', 'RS'],
  ['Kroaci', 'HR'], ['Kroacia', 'HR'],
  ['Greqi', 'GR'], ['Greqia', 'GR'],
  ['Turqi', 'TR'], ['Turqia', 'TR'],
  ['Holandë', 'NL'], ['Holanda', 'NL'],
  ['Belgjikë', 'BE'], ['Belgjika', 'BE'],
  ['Poloni', 'PL'], ['Polonia', 'PL'],
  ['Rumani', 'RO'], ['Rumania', 'RO'],
  ['Suedi', 'SE'], ['Suedia', 'SE'],
  ['Norvegji', 'NO'], ['Norvegjia', 'NO'],
  ['Finlandë', 'FI'], ['Finlanda', 'FI'],
  ['Danimarkë', 'DK'], ['Danimarka', 'DK'],
  ['Irlandë', 'IE'], ['Irlanda', 'IE'],
  ['Çeki', 'CZ'], ['Çekia', 'CZ'],
  ['Sllovaki', 'SK'], ['Sllovakia', 'SK'],
  ['Hungari', 'HU'], ['Hungaria', 'HU'],
  ['Bullgari', 'BG'], ['Bullgaria', 'BG'],
  ['Slloveni', 'SI'], ['Sllovenia', 'SI'],
  ['Mali i Zi', 'ME'],
  ['Bosnjë', 'BA'], ['Bosnjë dhe Hercegovinë', 'BA'],
  ['Luksemburg', 'LU'], ['Luksemburgu', 'LU'],
  ['Lihtenshtajn', 'LI'],
  ['Qipro', 'CY'], ['Maltë', 'MT'], ['Malta', 'MT'],
  ['Ukrainë', 'UA'], ['Ukraina', 'UA'],
  ['Moldavi', 'MD'], ['Moldavia', 'MD'],
  ['Bjellorusi', 'BY'], ['Bjellorusja', 'BY'],
  ['Rusi', 'RU'], ['Rusia', 'RU'],
  ['Estoni', 'EE'], ['Estonia', 'EE'],
  ['Letoni', 'LV'], ['Letonia', 'LV'],
  ['Lituani', 'LT'], ['Lituania', 'LT'],
  ['Islandë', 'IS'], ['Islanda', 'IS'],
  ['Mbretëria e Bashkuar', 'GB'], ['Britani', 'GB'],
];

for (const [name, code] of RAW_COUNTRY_NAMES) {
  COUNTRY_NAME_TO_CODE[stripDiacritics(name).toLowerCase()] = code;
}

function countryCodeFromName(input: string): string | null {
  const normalized = stripDiacritics(input).toLowerCase().trim();
  if (normalized.length === 2) {
    const upper = normalized.toUpperCase();
    if (Object.values(COUNTRY_NAME_TO_CODE).includes(upper)) return upper;
  }
  return COUNTRY_NAME_TO_CODE[normalized] || null;
}

// ─── Tests ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(description: string, input: string, expected: string | null) {
  const result = countryCodeFromName(input);
  if (result === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${description}`);
    console.error(`        Input: "${input}" → Got: ${result}, Expected: ${expected}`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  Country Name Resolution — Test Suite');
console.log('═══════════════════════════════════════════════════════');

// ─── 1. Customer-reported bugs ──────────────────────────────
console.log('\n── Customer-reported bugs ──');

test('SQ: "Zvicer" → CH (without diacritics)',    'Zvicer',  'CH');
test('SQ: "Zvicër" → CH (with diacritics)',        'Zvicër',  'CH');
test('SQ: "Zvicra" → CH (definite form)',           'Zvicra',  'CH');
test('SQ: "zvicer" → CH (lowercase no diacritics)', 'zvicer',  'CH');
test('SQ: "zvicër" → CH (lowercase with diacritics)', 'zvicër', 'CH');
test('SQ: "zvicra" → CH (lowercase definite)',      'zvicra',  'CH');
test('DE: "Italien" → IT',                          'Italien', 'IT');
test('SQ: "Itali" → IT (Albanian indefinite)',      'Itali',   'IT');
test('SQ: "Italia" → IT (Albanian definite)',       'Italia',  'IT');
test('SQ: "itali" → IT (lowercase)',                'itali',   'IT');

// ─── 2. Switzerland — all 5 languages ──────────────────────
console.log('\n── Switzerland (CH) — all languages ──');

test('DE: Schweiz',          'Schweiz',      'CH');
test('DE: schweiz (lower)',  'schweiz',      'CH');
test('EN: Switzerland',      'Switzerland',  'CH');
test('FR: Suisse',           'Suisse',       'CH');
test('IT: Svizzera',         'Svizzera',     'CH');
test('SQ: Zvicër',           'Zvicër',       'CH');
test('SQ: Zvicra',           'Zvicra',       'CH');
test('SQ: Zvicer (no ë)',    'Zvicer',       'CH');
test('Code: CH',             'CH',           'CH');
test('Code: ch (lower)',     'ch',           'CH');

// ─── 3. Germany — all languages ─────────────────────────────
console.log('\n── Germany (DE) — all languages ──');

test('DE: Deutschland',      'Deutschland',  'DE');
test('EN: Germany',          'Germany',      'DE');
test('FR: Allemagne',        'Allemagne',    'DE');
test('IT: Germania',         'Germania',     'DE');
test('SQ: Gjermani',         'Gjermani',     'DE');
test('SQ: Gjermania',        'Gjermania',    'DE');

// ─── 4. Italy — all languages ───────────────────────────────
console.log('\n── Italy (IT) — all languages ──');

test('DE: Italien',          'Italien',      'IT');
test('EN: Italy',            'Italy',        'IT');
test('FR: Italie',           'Italie',       'IT');
test('IT: Italia',           'Italia',       'IT');
test('SQ: Itali',            'Itali',        'IT');

// ─── 5. Austria — all languages ─────────────────────────────
console.log('\n── Austria (AT) — all languages ──');

test('DE: Österreich',       'Österreich',   'AT');
test('DE: Osterreich (no ö)', 'Osterreich',  'AT');
test('EN: Austria',          'Austria',      'AT');
test('FR: Autriche',         'Autriche',     'AT');
test('SQ: Austri',           'Austri',       'AT');
test('SQ: Austria',          'Austria',      'AT');

// ─── 6. Albania — all languages ─────────────────────────────
console.log('\n── Albania (AL) — all languages ──');

test('DE: Albanien',         'Albanien',     'AL');
test('EN: Albania',          'Albania',      'AL');
test('FR: Albanie',          'Albanie',      'AL');
test('SQ: Shqipëri',        'Shqipëri',     'AL');
test('SQ: Shqipëria',       'Shqipëria',    'AL');
test('SQ: Shqiperi (no ë)', 'Shqiperi',     'AL');

// ─── 7. Kosovo — all languages ──────────────────────────────
console.log('\n── Kosovo (XK) — all languages ──');

test('DE/EN: Kosovo',        'Kosovo',       'XK');
test('SQ: Kosovë',          'Kosovë',       'XK');
test('SQ: Kosova',           'Kosova',       'XK');
test('SQ: kosove (no ë)',    'kosove',       'XK');

// ─── 8. Countries with diacritics in DE/FR ──────────────────
console.log('\n── Diacritics in DE/FR names ──');

test('DE: Türkei',           'Türkei',       'TR');
test('DE: Turkei (no ü)',    'Turkei',       'TR');
test('DE: Rumänien',         'Rumänien',     'RO');
test('DE: Rumanien (no ä)',  'Rumanien',     'RO');
test('FR: Grèce',            'Grèce',        'GR');
test('FR: Grece (no è)',     'Grece',        'GR');
test('FR: Suède',            'Suède',        'SE');
test('FR: Suede (no è)',     'Suede',        'SE');
test('FR: Norvège',          'Norvège',      'NO');
test('FR: Norvege (no è)',   'Norvege',      'NO');
test('FR: Tchéquie',         'Tchéquie',     'CZ');
test('FR: Tchequie (no é)',  'Tchequie',     'CZ');

// ─── 9. SQ diacritics variants ──────────────────────────────
console.log('\n── SQ diacritics variants ──');

test('SQ: Francë',          'Francë',       'FR');
test('SQ: France (no ë)',   'France',       'FR');
test('SQ: Franca',          'Franca',       'FR');
test('SQ: Spanjë',          'Spanjë',       'ES');
test('SQ: Spanje (no ë)',   'Spanje',       'ES');
test('SQ: Holandë',         'Holandë',      'NL');
test('SQ: Holande (no ë)',  'Holande',      'NL');
test('SQ: Belgjikë',        'Belgjikë',     'BE');
test('SQ: Belgjike (no ë)', 'Belgjike',     'BE');
test('SQ: Greqi',            'Greqi',        'GR');
test('SQ: Greqia',           'Greqia',       'GR');
test('SQ: Turqi',            'Turqi',        'TR');
test('SQ: Turqia',           'Turqia',       'TR');
test('SQ: Çeki',             'Çeki',         'CZ');
test('SQ: Ceki (no ç)',     'Ceki',         'CZ');

// ─── 10. "City, Country" format (last part extraction) ──────
console.log('\n── "City, Country" format (last part) ──');

function testCityCountry(description: string, input: string, expected: string | null) {
  const parts = input.split(',').map(p => p.trim());
  const lastPart = parts[parts.length - 1];
  const result = countryCodeFromName(lastPart);
  if (result === expected) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${description}`);
    console.error(`        Input: "${input}" → lastPart: "${lastPart}" → Got: ${result}, Expected: ${expected}`);
  }
}

testCityCountry('Zürich, Schweiz',          'Zürich, Schweiz',       'CH');
testCityCountry('Berlin, Deutschland',      'Berlin, Deutschland',   'DE');
testCityCountry('Tiranë, Shqipëri',        'Tiranë, Shqipëri',     'AL');
testCityCountry('Prishtinë, Kosovë',       'Prishtinë, Kosovë',    'XK');
testCityCountry('Roma, Italia',              'Roma, Italia',          'IT');
testCityCountry('Milano, Italien',           'Milano, Italien',       'IT');

// ─── 11. Direct country codes ───────────────────────────────
console.log('\n── Direct country codes ──');

test('Code: CH', 'CH', 'CH');
test('Code: DE', 'DE', 'DE');
test('Code: AT', 'AT', 'AT');
test('Code: IT', 'IT', 'IT');
test('Code: AL', 'AL', 'AL');
test('Code: XK', 'XK', 'XK');
test('Code: TR', 'TR', 'TR');
test('Code: GR', 'GR', 'GR');
test('Code: FR', 'FR', 'FR');

// ─── 12. Edge cases ─────────────────────────────────────────
console.log('\n── Edge cases ──');

test('Empty string',         '',             null);
test('Random text',          'asdfgh',       null);
test('City name',            'Zürich',       null);
test('Whitespace',           '  Schweiz  ',  'CH');
test('UPPERCASE',            'SCHWEIZ',      'CH');
test('MiXeD cAsE',           'sChWeIz',      'CH');
test('ITALIEN uppercase',    'ITALIEN',      'IT');
test('Zvicër with space',    ' Zvicër ',     'CH');

// ─── Results ────────────────────────────────────────────────
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════');
console.log('');

if (failed > 0) {
  process.exit(1);
}
