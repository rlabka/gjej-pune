import { prisma } from '../config/prisma';
import { resolveCountryCode } from '../utils/geocode';

// ─── Strip diacritics + flag emojis for fuzzy country matching ────────
function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols (flag emojis like 🇨🇭)
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Fuzzy place matcher ──────────────────────────────────────────────
// Handles real-world inconsistencies in stored vs typed city names:
//   - Diacritics:        "Tirana" -> "Tiranë", "Zurich" -> "Zürich"
//   - Ending variations: "Tirana" -> "Tirane", "Geneva" -> "Genève"
//   - Cross-language translations via the explicit alias map below
//     (Albanian/English/German/Italian for the main Western-European
//     and Balkan cities our user base uses).
//   - Stored places with extra components like
//     "Tiranë, 1001-1028, Shqipëria Qendrore, Shqipëria"

// Each row contains every known spelling/translation of one city.
// All entries are lowercase + diacritic-stripped (the matcher does the
// same to its inputs, so no special handling needed here).
const CITY_ALIAS_GROUPS: string[][] = [
  // ─── Albania / Kosovo
  ['tirana', 'tirane'],
  ['pristina', 'prishtina', 'prishtine'],
  ['vlora', 'vlore', 'valona'],
  ['durres', 'durazzo'],
  ['shkodra', 'shkoder', 'scutari', 'skadar'],
  ['korca', 'korce'],
  ['elbasan', 'elbasani'],
  ['fier', 'fieri'],
  ['berat', 'berati'],
  ['gjirokaster', 'gjirokastra', 'argirocastro'],
  ['peja', 'pec'],
  ['prizren', 'prizreni'],
  ['mitrovica', 'mitrovice'],
  // ─── Germany
  ['cologne', 'koln'],
  ['munich', 'munchen'],
  ['nuremberg', 'nurnberg'],
  ['mayence', 'mainz'],
  ['frankfurt'],
  // ─── Austria
  ['vienna', 'wien'],
  ['salzburg'],
  // ─── Switzerland
  ['geneva', 'geneve', 'genf', 'ginevra'],
  ['zurich', 'zurigo', 'cyrihu'],
  ['basel', 'bale', 'basilea'],
  ['bern', 'berne', 'berna', 'berni'],
  ['lucerne', 'luzern', 'lucerna'],
  // ─── Italy
  ['rome', 'roma', 'rom'],
  ['milan', 'milano', 'mailand'],
  ['florence', 'firenze', 'florenz'],
  ['venice', 'venezia', 'venedig'],
  ['turin', 'torino'],
  ['naples', 'napoli', 'neapel'],
  ['genoa', 'genova', 'genua'],
  // ─── France
  ['marseille', 'marseilles'],
  ['lyon', 'lyons', 'lione'],
];

// Build an O(1) lookup: each variant → Set of all variants in its group.
const CITY_ALIASES: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>();
  for (const group of CITY_ALIAS_GROUPS) {
    const set = new Set(group);
    for (const name of group) map.set(name, set);
  }
  return map;
})();

function tokenize(s: string): string[] {
  return s.split(/[^a-z0-9]+/i).filter((t) => t.length >= 3 && !/^\d+$/.test(t));
}

function tokensMatch(qt: string, pt: string): boolean {
  if (qt === pt) return true;
  if (pt.includes(qt) || qt.includes(pt)) return true;
  // 5-char prefix overlap covers Tirana/Tirane, Geneva/Geneve etc.
  const minLen = Math.min(qt.length, pt.length);
  if (minLen >= 5 && qt.slice(0, 5) === pt.slice(0, 5)) return true;
  // Cross-language alias (e.g. Pristina ↔ Prishtine, Vlora ↔ Vlore).
  const aliases = CITY_ALIASES.get(qt);
  if (aliases) {
    for (const alias of aliases) {
      if (alias === pt) return true;
      if (pt.includes(alias) || alias.includes(pt)) return true;
    }
  }
  return false;
}

function placeMatches(query: string, place: string): boolean {
  if (!query || !place) return false;
  const q = stripDiacritics(query.toLowerCase());
  const p = stripDiacritics(place.toLowerCase());
  if (p.includes(q)) return true;
  const qTokens = tokenize(q);
  if (qTokens.length === 0) return false;
  const pTokens = tokenize(p);
  return qTokens.every((qt) => pTokens.some((pt) => tokensMatch(qt, pt)));
}

// ─── Country Name → Code Mapping (all supported languages) ─
// Keys are stored WITHOUT diacritics (stripped) so lookup is accent-insensitive.
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
  // SQ — all common variants including definite/indefinite forms
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

// Build the lookup map with stripped-diacritics keys
for (const [name, code] of RAW_COUNTRY_NAMES) {
  COUNTRY_NAME_TO_CODE[stripDiacritics(name).toLowerCase()] = code;
}

function countryCodeFromName(input: string): string | null {
  const normalized = stripDiacritics(input).toLowerCase().trim();
  // Direct code match (e.g. "CH", "DE")
  if (normalized.length === 2) {
    const upper = normalized.toUpperCase();
    if (Object.values(COUNTRY_NAME_TO_CODE).includes(upper)) return upper;
  }
  return COUNTRY_NAME_TO_CODE[normalized] || null;
}

// ─── Haversine Distance (km) ────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Types ──────────────────────────────────────────────

interface CreateAdInput {
  userId: string;
  category: string;
  firstName: string;
  surname: string;
  phone: string;
  email?: string;
  age?: number;
  photoUrl?: string;
  experience?: string;
  availability?: string;
  livingPlace?: string;
  lat?: number;
  lng?: number;
  skills?: string[];
  spokenLanguages?: string[];
}

// ─── Experience Bucket Mapping ──────────────────────────
// Parses free-text experience strings (e.g. "3 years", "5+ vite", "10+ years",
// "Fillestar", "Berufseinsteiger") into one of: entry | junior | mid | senior.
function experienceBucket(exp: string | null | undefined): 'entry' | 'junior' | 'mid' | 'senior' | null {
  if (!exp) return null;
  const s = exp.toLowerCase().trim();
  // Entry-level keywords across supported languages
  if (/\b(fillestar|entry|berufseinsteig|débutant|principiant|anfänger|0\s*(year|vite|jahr))\b/.test(s)) return 'entry';
  // Extract first integer (possibly followed by '+')
  const m = s.match(/(\d+)\s*\+?/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (n < 1) return 'entry';
  if (n < 3) return 'junior';
  if (n < 5) return 'mid';
  return 'senior';
}

// ─── Create Ad ──────────────────────────────────────────

export async function createAd(input: CreateAdInput) {
  const countryCode = await resolveCountryCode({ lat: input.lat, lng: input.lng, place: input.livingPlace });
  return prisma.jobSeekerAd.create({
    data: {
      userId: input.userId,
      category: input.category,
      firstName: input.firstName,
      surname: input.surname,
      phone: input.phone,
      email: input.email || null,
      age: input.age ?? null,
      photoUrl: input.photoUrl || null,
      experience: input.experience || null,
      availability: input.availability || null,
      livingPlace: input.livingPlace || null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      countryCode,
      skills: JSON.stringify(input.skills || []),
      spokenLanguages: JSON.stringify(input.spokenLanguages || []),
    },
  });
}

// ─── Get Ads by User ────────────────────────────────────

export async function getAdsByUser(userId: string) {
  const ads = await prisma.jobSeekerAd.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return ads.map((ad) => ({ ...ad, skills: JSON.parse(ad.skills), spokenLanguages: JSON.parse(ad.spokenLanguages) }));
}

/**
 * Bump every active ad of this user to the top of the Premium group by
 * updating their `updatedAt` to NOW. Called when a subscription becomes
 * active (initial purchase or renewal) so the user re-surfaces in the
 * feed instead of being stuck under older Premium listings.
 */
export async function bumpUserAdsOnPremiumActivation(userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "JobSeekerAd"
    SET "updatedAt" = NOW()
    WHERE "userId" = ${userId} AND status = 'Active'
  `;
}

// ─── Get All Ads (public listing) ───────────────────────

export async function getAds(filters: { keyword?: string; category?: string; location?: string; lat?: number; lng?: number; radius?: number; page?: number; limit?: number; sort?: string; experience?: string; availability?: string } = {}) {
  const where: any = { status: 'Active', photoUrl: { not: null, notIn: [''] } };
  if (filters.category) {
    const cats = filters.category.split(',').map(c => c.trim()).filter(Boolean);
    if (cats.length === 1) {
      where.category = cats[0];
    } else if (cats.length > 1) {
      where.category = { in: cats };
    }
  }
  if (filters.availability) {
    const avails = filters.availability.split(',').map(a => a.trim()).filter(Boolean);
    if (avails.length === 1) where.availability = avails[0];
    else if (avails.length > 1) where.availability = { in: avails };
  }
  const expBuckets = filters.experience
    ? new Set(filters.experience.split(',').map(e => e.trim()).filter(Boolean))
    : null;
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const locationIsCountry = filters.location
    ? countryCodeFromName(filters.location.split(',').map(p => p.trim()).pop() || filters.location) != null
    : false;
  const isRadiusSearch = filters.lat != null && filters.lng != null && !locationIsCountry;

  // Only apply lat/lng bounding box for actual radius searches (not country-level)
  if (isRadiusSearch && filters.lat != null && filters.lng != null) {
    const r = filters.radius || 100;
    const latDelta = r / 111.32;
    const lngDelta = r / (111.32 * Math.cos((filters.lat * Math.PI) / 180));
    where.lat = { gte: filters.lat - latDelta, lte: filters.lat + latDelta };
    where.lng = { gte: filters.lng - lngDelta, lte: filters.lng + lngDelta };
  }

  if (isRadiusSearch) {
    const r = filters.radius || 100;
    let allAds = await prisma.jobSeekerAd.findMany({
      where,
      include: { user: { select: { displayName: true, isPremium: true } } },
    });

    // Case-insensitive keyword filter for radius search too
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      allAds = allAds.filter((a) =>
        a.firstName.toLowerCase().includes(kw) ||
        a.surname.toLowerCase().includes(kw) ||
        a.category.toLowerCase().includes(kw)
      );
    }

    if (expBuckets) {
      allAds = allAds.filter((a) => {
        const b = experienceBucket(a.experience);
        return b != null && expBuckets.has(b);
      });
    }

    const withDistance = allAds
      .map((ad) => {
        const dist = (ad.lat != null && ad.lng != null)
          ? haversineKm(filters.lat!, filters.lng!, ad.lat, ad.lng)
          : 9999;
        return { ...ad, skills: JSON.parse(ad.skills), spokenLanguages: JSON.parse(ad.spokenLanguages), distance_km: Math.round(dist * 10) / 10, isBoosted: ad.user?.isPremium || false };
      })
      .filter((a) => a.distance_km <= r)
      .sort((a, b) => {
        // Explicit date sort overrides premium boost so the user's choice wins.
        if (filters.sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (filters.sort === 'newest' || filters.sort === 'date') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Default (relevance): premium first, then nearest.
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return a.distance_km - b.distance_km;
      });

    const total = withDistance.length;
    const skip = (page - 1) * limit;
    const paged = withDistance.slice(skip, skip + limit);

    return { ads: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Normal text-based search: fetch all, sort premium first, paginate
  let allAdsNormal = await prisma.jobSeekerAd.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { displayName: true, isPremium: true } } },
  });

  // Case-insensitive keyword filter (SQLite INSTR is case-sensitive)
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    allAdsNormal = allAdsNormal.filter((a) =>
      a.firstName.toLowerCase().includes(kw) ||
      a.surname.toLowerCase().includes(kw) ||
      a.category.toLowerCase().includes(kw)
    );
  }

  if (expBuckets) {
    allAdsNormal = allAdsNormal.filter((a) => {
      const b = experienceBucket(a.experience);
      return b != null && expBuckets.has(b);
    });
  }

  // Case-insensitive location text filter with country name resolution.
  // The user may type either a city ("Tirana"), a country ("Schweiz"),
  // or both ("Tirana, Albania"). Both sides of the comparison are diacritic-
  // stripped so "Tirana" matches stored "Tiranë", "Zurich" matches "Zürich".
  if (filters.location && (filters.lat == null || filters.lng == null || locationIsCountry)) {
    const locRaw = filters.location.toLowerCase().trim();
    const loc = stripDiacritics(locRaw);
    const resolvedCode = countryCodeFromName(locRaw);
    const partsRaw = locRaw.split(',').map(p => p.trim()).filter(Boolean);
    const lastPart = partsRaw.length > 1 ? partsRaw[partsRaw.length - 1] : null;
    const resolvedCodeFromPart = lastPart ? countryCodeFromName(lastPart) : null;

    // City parts = parts the user typed that are NOT country names.
    // For "Tirana, Albania" that's just ["tirana"]; the ad's livingPlace
    // must fuzzy-match ALL of them in addition to the country match.
    const cityRaws = partsRaw.filter((p) => countryCodeFromName(p) == null);

    const COUNTRY_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
      CH: { latMin: 45.8, latMax: 47.9, lngMin: 5.9, lngMax: 10.5 },
      DE: { latMin: 47.2, latMax: 55.1, lngMin: 5.8, lngMax: 15.1 },
      AT: { latMin: 46.3, latMax: 49.0, lngMin: 9.5, lngMax: 17.2 },
      IT: { latMin: 36.6, latMax: 47.1, lngMin: 6.6, lngMax: 18.5 },
      FR: { latMin: 41.3, latMax: 51.1, lngMin: -5.2, lngMax: 9.6 },
      AL: { latMin: 39.6, latMax: 42.7, lngMin: 19.3, lngMax: 21.1 },
      XK: { latMin: 42.0, latMax: 43.3, lngMin: 20.0, lngMax: 21.8 },
    };

    const isCountrySearch = resolvedCode != null || resolvedCodeFromPart != null;

    allAdsNormal = allAdsNormal.filter((a) => {
      if (isCountrySearch) {
        // Country side must match via countryCode column or bbox fallback.
        const code = resolvedCode || resolvedCodeFromPart;
        let countryOk = false;
        if (code) {
          if (a.countryCode === code) countryOk = true;
          else if (!a.countryCode && a.lat != null && a.lng != null) {
            const b = COUNTRY_BOUNDS[code];
            if (b && a.lat >= b.latMin && a.lat <= b.latMax && a.lng >= b.lngMin && a.lng <= b.lngMax) {
              countryOk = true;
            }
          }
        }
        if (!countryOk) return false;
        // City side (e.g. "Tirana" from "Tirana, Albania") must fuzzy-match.
        if (cityRaws.length > 0) {
          return cityRaws.every((p) => placeMatches(p, a.livingPlace || ''));
        }
        return true;
      }

      // No country recognised — pure city/text fuzzy match.
      if (placeMatches(locRaw, a.livingPlace || '')) return true;
      if (a.countryCode && a.countryCode.toLowerCase() === loc) return true;
      // Multi-part input ("City, Region" without country): any part is enough.
      if (partsRaw.length > 1) {
        return partsRaw.some((p) => placeMatches(p, a.livingPlace || ''));
      }
      return false;
    });
  }

  const total = allAdsNormal.length;

  const sorted = allAdsNormal
    .map((ad: any) => ({ ...ad, skills: JSON.parse(ad.skills), spokenLanguages: JSON.parse(ad.spokenLanguages), isBoosted: ad.user?.isPremium || false }))
    .sort((a: any, b: any) => {
      // Explicit date sort: user chose it, so it wins over Premium boost.
      if (filters.sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sort === 'newest' || filters.sort === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      // Default (relevance): Premium first.
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;

      // Within the Premium group: most recently bumped first. Bumps happen
      // when the user renews their subscription or edits the ad — so a
      // freshly-renewed Premium user pops back to the top of the Premium
      // group instead of being stuck under older Premium ads.
      if (a.isBoosted && b.isBoosted) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      // relevance (default): score by completeness + views + recency
      const scoreA = (a.views || 0) * 2 + (a.experience ? 5 : 0) + ((a.skills || []).length > 0 ? 3 : 0) + (a.photoUrl ? 3 : 0) + (a.age ? 1 : 0);
      const scoreB = (b.views || 0) * 2 + (b.experience ? 5 : 0) + ((b.skills || []).length > 0 ? 3 : 0) + (b.photoUrl ? 3 : 0) + (b.age ? 1 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const skip = (page - 1) * limit;
  const ads = sorted.slice(skip, skip + limit);

  return {
    ads,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Get All Categories (for filter sidebar) ────────────

export async function getAdCategories() {
  const rows = await prisma.jobSeekerAd.findMany({
    where: { status: 'Active' },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map(r => r.category);
}

// ─── Get Single Ad ──────────────────────────────────────

export async function getAdById(id: string, viewerKey?: string) {
  let ad = await prisma.jobSeekerAd.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  });
  if (!ad) return null;
  if (viewerKey) {
    try {
      await prisma.uniqueView.create({
        data: { targetType: 'ad', targetId: id, viewerKey },
      });
      ad = await prisma.jobSeekerAd.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: { user: { select: { displayName: true } } },
      });
    } catch {
      // unique constraint violation → already viewed, skip
    }
  }
  return { ...ad, skills: JSON.parse(ad.skills), spokenLanguages: JSON.parse(ad.spokenLanguages) };
}

// ─── Update Ad ──────────────────────────────────────────

export async function updateAd(id: string, userId: string, input: Partial<Omit<CreateAdInput, 'userId'>>) {
  const ad = await prisma.jobSeekerAd.findUnique({ where: { id } });
  if (!ad || ad.userId !== userId) return null;

  return prisma.jobSeekerAd.update({
    where: { id },
    data: {
      ...(input.category !== undefined && { category: input.category }),
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.surname !== undefined && { surname: input.surname }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email || null }),
      ...(input.age !== undefined && { age: input.age ?? null }),
      ...(input.experience !== undefined && { experience: input.experience || null }),
      ...(input.availability !== undefined && { availability: input.availability || null }),
      ...(input.livingPlace !== undefined && { livingPlace: input.livingPlace || null }),
      ...(input.lat !== undefined && { lat: input.lat ?? null }),
      ...(input.lng !== undefined && { lng: input.lng ?? null }),
      ...(input.skills !== undefined && { skills: JSON.stringify(input.skills || []) }),
      ...(input.spokenLanguages !== undefined && { spokenLanguages: JSON.stringify(input.spokenLanguages || []) }),
    },
  });
}

// ─── Delete Ad ──────────────────────────────────────────

export async function deleteAd(id: string, userId: string) {
  const ad = await prisma.jobSeekerAd.findUnique({ where: { id } });
  if (!ad || ad.userId !== userId) return false;
  await prisma.jobSeekerAd.delete({ where: { id } });
  return true;
}

// ─── Update Photo ───────────────────────────────────────

export async function updateAdPhoto(id: string, userId: string, photoUrl: string) {
  const ad = await prisma.jobSeekerAd.findUnique({ where: { id } });
  if (!ad || ad.userId !== userId) return null;
  return prisma.jobSeekerAd.update({ where: { id }, data: { photoUrl } });
}
