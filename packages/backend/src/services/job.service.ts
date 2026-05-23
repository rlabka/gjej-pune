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

// ─── Fuzzy place matcher (mirrors jobAd.service) ──────────────────────
// Cross-language city aliases — same table as jobAd.service. Kept in
// sync by hand; if it grows we can extract it to a shared module.
const CITY_ALIAS_GROUPS: string[][] = [
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
  ['cologne', 'koln'],
  ['munich', 'munchen'],
  ['nuremberg', 'nurnberg'],
  ['mayence', 'mainz'],
  ['frankfurt'],
  ['vienna', 'wien'],
  ['salzburg'],
  ['geneva', 'geneve', 'genf', 'ginevra'],
  ['zurich', 'zurigo', 'cyrihu'],
  ['basel', 'bale', 'basilea'],
  ['bern', 'berne', 'berna', 'berni'],
  ['lucerne', 'luzern', 'lucerna'],
  ['rome', 'roma', 'rom'],
  ['milan', 'milano', 'mailand'],
  ['florence', 'firenze', 'florenz'],
  ['venice', 'venezia', 'venedig'],
  ['turin', 'torino'],
  ['naples', 'napoli', 'neapel'],
  ['genoa', 'genova', 'genua'],
  ['marseille', 'marseilles'],
  ['lyon', 'lyons', 'lione'],
];

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
  const minLen = Math.min(qt.length, pt.length);
  if (minLen >= 5 && qt.slice(0, 5) === pt.slice(0, 5)) return true;
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

interface CreateJobInput {
  userId: string;
  category: string;
  contactName: string;
  contactSurname: string;
  contactPhone: string;
  contactEmail?: string;
  companyName?: string;
  salary?: number;
  salaryType?: string;
  currency?: string;
  locationState: string;
  locationCity: string;
  lat?: number;
  lng?: number;
  when?: string;
  description?: string;
}

interface JobFilters {
  keyword?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number; // km, default 30
  category?: string;
  when?: string;
  salaryMin?: number;
  salaryMax?: number;
  posted?: string;
  status?: string;
  sort?: string; // 'relevance' | 'date'
  page?: number;
  limit?: number;
}

// ─── Create Job ─────────────────────────────────────────

export async function createJob(input: CreateJobInput) {
  const countryCode = await resolveCountryCode({ lat: input.lat, lng: input.lng, place: `${input.locationCity}, ${input.locationState}` });
  return prisma.job.create({
    data: {
      userId: input.userId,
      category: input.category,
      contactName: input.contactName,
      contactSurname: input.contactSurname,
      contactPhone: input.contactPhone,
      contactEmail: input.contactEmail || null,
      companyName: input.companyName || null,
      salary: input.salary ?? null,
      salaryType: input.salaryType || 'Hour',
      currency: input.currency || 'EUR',
      locationState: input.locationState,
      locationCity: input.locationCity,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      countryCode,
      when: input.when || 'Negotiation',
      description: input.description || null,
    },
    include: { images: true },
  });
}

// ─── Get All Jobs (public listing) ──────────────────────

export async function getJobs(filters: JobFilters = {}) {
  const where: any = { status: filters.status || 'Active' };

  if (filters.lat != null && filters.lng != null) {
    // Radius search via bounding box (default 100 km)
    const r = filters.radius || 100;
    const latDelta = r / 111.32;
    const lngDelta = r / (111.32 * Math.cos((filters.lat * Math.PI) / 180));
    where.lat = { gte: filters.lat - latDelta, lte: filters.lat + latDelta };
    where.lng = { gte: filters.lng - lngDelta, lte: filters.lng + lngDelta };
  }
  // NOTE: keyword and location text filters are applied case-insensitive in JS after fetch
  // because SQLite Prisma `contains` uses INSTR() which is case-sensitive
  if (filters.category) {
    const cats = filters.category.split(',').map(c => c.trim()).filter(Boolean);
    if (cats.length === 1) {
      where.category = cats[0];
    } else if (cats.length > 1) {
      where.category = { in: cats };
    }
  }
  if (filters.when) {
    const whens = filters.when.split(',').map(w => w.trim()).filter(Boolean);
    if (whens.length === 1) {
      where.when = whens[0];
    } else if (whens.length > 1) {
      where.when = { in: whens };
    }
  }
  if (filters.posted) {
    const hoursMap: Record<string, number> = { '24h': 24, '7d': 168, '14d': 336, '30d': 720 };
    const maxHours = hoursMap[filters.posted];
    if (maxHours) {
      where.createdAt = { gte: new Date(Date.now() - maxHours * 3600000) };
    }
  }
  if (filters.salaryMin != null) {
    where.salary = { ...(where.salary || {}), gte: filters.salaryMin };
  }
  if (filters.salaryMax != null) {
    where.salary = { ...(where.salary || {}), lte: filters.salaryMax };
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));

  // If location text resolves to a country/region, prefer text-based search over radius
  const locationIsCountry = filters.location
    ? countryCodeFromName(filters.location.split(',').map(p => p.trim()).pop() || filters.location) != null
    : false;
  const isRadiusSearch = filters.lat != null && filters.lng != null && !locationIsCountry;

  // Remove bounding-box constraints when searching by country name — they restrict results to a small area
  if (locationIsCountry) {
    delete where.lat;
    delete where.lng;
  }

  if (isRadiusSearch) {
    // Radius search: fetch all bounding-box matches, compute exact distance, sort, paginate in-memory
    const r = filters.radius || 100;
    let allJobsRadius = await prisma.job.findMany({
      where,
      include: { images: true, user: { select: { displayName: true, isPremium: true } } },
    });

    // Case-insensitive keyword filter for radius search too
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      allJobsRadius = allJobsRadius.filter((j) =>
        j.category.toLowerCase().includes(kw) ||
        (j.companyName || '').toLowerCase().includes(kw) ||
        (j.description || '').toLowerCase().includes(kw)
      );
    }

    const withDistance = allJobsRadius
      .map((job) => {
        const dist = (job.lat != null && job.lng != null)
          ? haversineKm(filters.lat!, filters.lng!, job.lat, job.lng)
          : 9999;
        return { ...job, distance_km: Math.round(dist * 10) / 10, isBoosted: job.user?.isPremium || false };
      })
      .filter((j) => j.distance_km <= r)
      .sort((a, b) => {
        // Premium (boosted) jobs first
        if (a.isBoosted && !b.isBoosted) return -1;
        if (!a.isBoosted && b.isBoosted) return 1;
        return a.distance_km - b.distance_km;
      });

    const total = withDistance.length;
    const skip = (page - 1) * limit;
    const paged = withDistance.slice(skip, skip + limit);

    return { jobs: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Normal text-based search: fetch all matching, sort premium first, then paginate
  let allJobs = await prisma.job.findMany({
    where,
    include: { images: true, user: { select: { displayName: true, isPremium: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // Case-insensitive + diacritic-insensitive keyword filter. Includes city
  // and state so "Tirana" typed into the search bar also returns jobs whose
  // locationCity is stored as "Tiranë" — users naturally type city names
  // into the keyword box, not just into the location filter.
  if (filters.keyword) {
    const kwRaw = filters.keyword.toLowerCase();
    const kw = stripDiacritics(kwRaw);
    allJobs = allJobs.filter((j) => {
      const fields = [
        j.category,
        j.companyName || '',
        j.description || '',
        j.locationCity || '',
        j.locationState || '',
      ];
      return fields.some((f) => stripDiacritics(f.toLowerCase()).includes(kw));
    });
  }

  // Case-insensitive location text filter. Handles three input shapes:
  //   "Tirana"          → city/state substring match
  //   "Schweiz"         → country code match
  //   "Tirana, Albania" → country code match AND city substring match
  // Both sides are diacritic-stripped so "Tirana" matches "Tiranë",
  // "Zurich" matches "Zürich", etc.
  if (filters.location && (filters.lat == null || filters.lng == null || locationIsCountry)) {
    const locRaw = filters.location.toLowerCase().trim();
    const loc = stripDiacritics(locRaw);
    const resolvedCode = countryCodeFromName(locRaw);
    const partsRaw = locRaw.split(',').map(p => p.trim()).filter(Boolean);
    const lastPart = partsRaw.length > 1 ? partsRaw[partsRaw.length - 1] : null;
    const resolvedCodeFromPart = lastPart ? countryCodeFromName(lastPart) : null;

    // City parts = the parts the user typed that are NOT country names.
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

    allJobs = allJobs.filter((j) => {
      const cityField = j.locationCity || '';
      const stateField = j.locationState || '';
      const placeBlob = `${cityField}, ${stateField}`;

      if (isCountrySearch) {
        const code = resolvedCode || resolvedCodeFromPart;
        let countryOk = false;
        if (code) {
          if (j.countryCode === code) countryOk = true;
          else if (!j.countryCode && j.lat != null && j.lng != null) {
            const b = COUNTRY_BOUNDS[code];
            if (b && j.lat >= b.latMin && j.lat <= b.latMax && j.lng >= b.lngMin && j.lng <= b.lngMax) {
              countryOk = true;
            }
          }
        }
        if (!countryOk) return false;
        if (cityRaws.length > 0) {
          return cityRaws.every((p) => placeMatches(p, placeBlob));
        }
        return true;
      }

      // No country in input — fuzzy match against city + state.
      if (placeMatches(locRaw, placeBlob)) return true;
      if (j.countryCode && j.countryCode.toLowerCase() === loc) return true;
      if (partsRaw.length > 1) {
        return partsRaw.some((p) => placeMatches(p, placeBlob));
      }
      return false;
    });
  }

  const total = allJobs.length;

  // Sort: 'date' = newest first; default = Premium first (bumped on renewal).
  const sorted = allJobs
    .map((job) => ({ ...job, isBoosted: job.user?.isPremium || false }))
    .sort((a, b) => {
      if (filters.sort === 'date' || filters.sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // Default: Premium first, then by updatedAt within the Premium group so
      // a freshly-renewed Premium user re-surfaces above older Premium jobs.
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      if (a.isBoosted && b.isBoosted) {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const skip = (page - 1) * limit;
  const jobs = sorted.slice(skip, skip + limit);

  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Get All Categories (for filter sidebar) ────────────

export async function getJobCategories() {
  const rows = await prisma.job.findMany({
    where: { status: 'Active' },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map(r => r.category);
}

// ─── Get Jobs by User (employer dashboard) ──────────────

export async function getJobsByUser(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    include: { images: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Bump every active job of this user to the top of the Premium group by
 * updating their `updatedAt` to NOW. Called when a subscription becomes
 * active so a renewed employer re-surfaces above older Premium jobs.
 */
export async function bumpUserJobsOnPremiumActivation(userId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "Job"
    SET "updatedAt" = NOW()
    WHERE "userId" = ${userId} AND status = 'Active'
  `;
}

// ─── Get Single Job ─────────────────────────────────────

export async function getJobById(id: string, viewerKey?: string) {
  let job = await prisma.job.findUnique({
    where: { id },
    include: { images: true, user: { select: { displayName: true } } },
  });
  if (job && viewerKey) {
    try {
      await prisma.uniqueView.create({
        data: { targetType: 'job', targetId: id, viewerKey },
      });
      job = await prisma.job.update({
        where: { id },
        data: { views: { increment: 1 } },
        include: { images: true, user: { select: { displayName: true } } },
      });
    } catch {
      // unique constraint violation → already viewed, skip
    }
  }
  return job;
}

// ─── Update Job ─────────────────────────────────────────

export async function updateJob(id: string, userId: string, data: Partial<CreateJobInput> & { status?: string }) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.userId !== userId) return null;

  const { userId: _, ...updateData } = data as any;
  return prisma.job.update({ where: { id }, data: updateData, include: { images: true } });
}

// ─── Delete Job ─────────────────────────────────────────

export async function deleteJob(id: string, userId: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.userId !== userId) return false;
  await prisma.job.delete({ where: { id } });
  return true;
}

// ─── Recommended Jobs (smart algorithm) ─────────────────

export async function getRecommendedJobs(userId: string) {
  // 1. Load user profile + their ads (categories + skills) + experience
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      location: true,
      experience: true,
      jobSeekerAds: { select: { category: true, skills: true, livingPlace: true, lat: true, lng: true } },
    },
  });
  if (!user) return [];

  // Collect keywords the user is interested in (from ads categories + ad skills + experience roles)
  const userKeywords = new Set<string>();
  let userLat: number | null = null;
  let userLng: number | null = null;

  for (const ad of (user as any).jobSeekerAds) {
    userKeywords.add(ad.category.toLowerCase());
    // Parse skills JSON and add each as keyword
    try {
      const skills = JSON.parse(ad.skills || '[]');
      if (Array.isArray(skills)) {
        for (const s of skills) {
          if (typeof s === 'string' && s.length > 1) userKeywords.add(s.toLowerCase());
        }
      }
    } catch {}
    // Use first ad with coordinates for geo-sorting
    if (userLat == null && ad.lat != null && ad.lng != null) {
      userLat = ad.lat;
      userLng = ad.lng;
    }
  }

  let experienceEntries: { role?: string; company?: string }[] = [];
  try { experienceEntries = JSON.parse((user as any).experience || '[]'); } catch {}
  for (const exp of experienceEntries) {
    if (exp.role) userKeywords.add(exp.role.toLowerCase());
  }

  // Normalise user location tokens for text matching
  const userLocationTokens = ((user as any).location || '')
    .toLowerCase()
    .split(/[,\s]+/)
    .map((t: string) => t.trim())
    .filter((t: string) => t.length > 2);

  // 2. Load all active jobs (exclude user's own)
  const jobs = await prisma.job.findMany({
    where: { status: 'Active', userId: { not: userId } },
    include: { images: true, user: { select: { displayName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

  const maxViews = Math.max(1, ...jobs.map(j => j.views));
  const maxShares = Math.max(1, ...jobs.map(j => j.shares));

  // 3. Score each job
  const scored = jobs.map((job) => {
    let score = 0;

    // Keyword match (40 pts) – fuzzy: job category or description contains any user keyword
    const jobCat = job.category.toLowerCase();
    const jobDesc = (job.description || '').toLowerCase();
    let keywordMatch = false;
    for (const kw of userKeywords) {
      if (jobCat.includes(kw) || kw.includes(jobCat) || jobDesc.includes(kw)) {
        keywordMatch = true;
        break;
      }
    }
    if (keywordMatch) score += 40;

    // Location proximity (30 pts)
    let distanceKm = 9999;
    if (userLat != null && userLng != null && job.lat != null && job.lng != null) {
      // Haversine
      const R = 6371;
      const dLat = ((job.lat - userLat) * Math.PI) / 180;
      const dLng = ((job.lng - userLng!) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((userLat * Math.PI) / 180) * Math.cos((job.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // Within 10km → 30pts, within 50km → 15pts, within 100km → 5pts
      if (distanceKm <= 10) score += 30;
      else if (distanceKm <= 50) score += 15;
      else if (distanceKm <= 100) score += 5;
    } else if (userLocationTokens.length > 0) {
      // Fallback: text-based location matching
      const jobLocTokens = `${job.locationCity} ${job.locationState}`.toLowerCase().split(/[,\s]+/).filter((t: string) => t.length > 2);
      const overlap = userLocationTokens.filter((t: string) => jobLocTokens.some((jt: string) => jt.includes(t) || t.includes(jt))).length;
      const locScore = Math.min(1, overlap / Math.max(1, userLocationTokens.length));
      score += Math.round(locScore * 30);
    }

    // Recency (20 pts) – linear decay over 30 days
    const age = now - new Date(job.createdAt).getTime();
    const recency = Math.max(0, 1 - age / THIRTY_DAYS);
    score += Math.round(recency * 20);

    // Popularity (10 pts)
    const pop = (job.views / maxViews) * 0.7 + (job.shares / maxShares) * 0.3;
    score += Math.round(pop * 10);

    return { ...job, matchScore: score, isTopMatch: score >= 60, distanceKm: Math.round(distanceKm) };
  });

  // 4. Only keep jobs that actually match user profile (keyword match required)
  const matched = scored.filter((j) => {
    const jobCat = j.category.toLowerCase();
    const jobDesc = (j.description || '').toLowerCase();
    for (const kw of userKeywords) {
      if (jobCat.includes(kw) || kw.includes(jobCat) || jobDesc.includes(kw)) return true;
    }
    return false;
  });

  // 5. Sort: primary by score desc, secondary by distance. Take top 10.
  matched.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.distanceKm - b.distanceKm;
  });
  return matched.slice(0, 10);
}

// ─── Employer Analytics ─────────────────────────────────

export async function getEmployerAnalytics(userId: string) {
  // All jobs by this employer
  const jobs = await prisma.job.findMany({
    where: { userId },
    select: {
      id: true,
      category: true,
      companyName: true,
      status: true,
      views: true,
      shares: true,
      locationCity: true,
      locationState: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const jobIds = jobs.map((j) => j.id);

  // Count favorites per job
  const favCounts = jobIds.length > 0
    ? await prisma.favorite.groupBy({
        by: ['targetId'],
        where: { targetType: 'job', targetId: { in: jobIds } },
        _count: true,
      })
    : [];
  const favMap = new Map(favCounts.map((f) => [f.targetId, f._count]));

  // Count conversations initiated per job
  const convCounts = jobIds.length > 0
    ? await prisma.conversation.groupBy({
        by: ['jobId'],
        where: { jobId: { in: jobIds } },
        _count: true,
      })
    : [];
  const convMap = new Map(convCounts.map((c) => [c.jobId!, c._count]));

  // Build per-job stats
  const jobStats = jobs.map((job) => ({
    id: job.id,
    category: job.category,
    companyName: job.companyName,
    status: job.status,
    views: job.views,
    shares: job.shares,
    favorites: favMap.get(job.id) || 0,
    conversations: convMap.get(job.id) || 0,
    locationCity: job.locationCity,
    locationState: job.locationState,
    createdAt: job.createdAt,
  }));

  // Aggregated totals
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'Active').length;
  const pausedJobs = jobs.filter((j) => j.status === 'Paused').length;
  const totalViews = jobs.reduce((s, j) => s + j.views, 0);
  const totalShares = jobs.reduce((s, j) => s + j.shares, 0);
  const totalFavorites = jobStats.reduce((s, j) => s + j.favorites, 0);
  const totalConversations = jobStats.reduce((s, j) => s + j.conversations, 0);

  return {
    totals: { totalJobs, activeJobs, pausedJobs, totalViews, totalShares, totalFavorites, totalConversations },
    jobs: jobStats,
  };
}

// ─── Add Image to Job ───────────────────────────────────

export async function addJobImage(jobId: string, userId: string, url: string, order: number = 0) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== userId) return null;
  return prisma.jobImage.create({ data: { jobId, url, order } });
}

// ─── Get Matching Candidates for a Job ──────────────────

export async function getMatchingCandidates(jobId: string, limit = 20) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return [];

  // ── Scoring weights (normalized to max 100) ──────────────
  // Category:  45 pts  |  Location: 25 pts  |  Recency: 15 pts
  // Profile:   10 pts  |  Premium:   5 pts  |  TOTAL: 100 pts

  const jobCatLower = job.category.toLowerCase();
  const categoryTokens = jobCatLower.split(/[\s\/,&\-()]+/).filter((t: string) => t.length > 2);

  const ads = await prisma.jobSeekerAd.findMany({
    where: { status: 'Active' },
    include: { user: { select: { displayName: true, isPremium: true } } },
    take: 200,
  });

  const scored = ads.map((ad) => {
    const adCatLower = ad.category.toLowerCase();
    const adSkills: string[] = JSON.parse(ad.skills || '[]');

    // ── Category relevance (max 45 pts) ──
    let categoryScore = 0;
    if (adCatLower === jobCatLower) {
      categoryScore = 45;                     // Exact match
    } else {
      const matchCount = categoryTokens.filter((t: string) => adCatLower.includes(t)).length;
      if (matchCount > 0) {
        categoryScore = Math.min(20, Math.round((matchCount / categoryTokens.length) * 20));
      }
    }

    if (categoryScore === 0) return null;     // No relevance → skip

    let score = categoryScore;

    // ── Location proximity (max 25 pts) ──
    if (ad.lat != null && ad.lng != null && job.lat != null && job.lng != null) {
      const dist = haversineKm(ad.lat, ad.lng, job.lat, job.lng);
      if (dist <= 10) score += 25;
      else if (dist <= 30) score += 18;
      else if (dist <= 60) score += 12;
      else if (dist <= 100) score += 6;
    } else if (ad.countryCode && job.countryCode && ad.countryCode === job.countryCode) {
      score += 5;
    }

    // ── Recency (max 15 pts) — rounded to full days for stable scores ──
    const daysSince = Math.floor((Date.now() - new Date(ad.createdAt).getTime()) / 86400000);
    score += Math.max(0, Math.round(15 * (1 - daysSince / 30)));

    // ── Profile quality (max 10 pts) ──
    if (ad.photoUrl) score += 3;
    if (ad.experience) score += 4;
    if (adSkills.length >= 3) score += 3;

    // ── Premium boost (max 5 pts) ──
    if (ad.user?.isPremium) score += 5;

    const adLanguages: string[] = JSON.parse(ad.spokenLanguages || '[]');
    return { ...ad, skills: adSkills, spokenLanguages: adLanguages, score, isBoosted: ad.user?.isPremium || false };
  });

  // Deduplicate: keep only the highest-scoring ad per user
  const bestPerUser = new Map<string, NonNullable<typeof scored[0]>>();
  for (const c of scored) {
    if (!c) continue;
    const existing = bestPerUser.get(c.userId);
    if (!existing || c.score > existing.score) {
      bestPerUser.set(c.userId, c);
    }
  }

  return Array.from(bestPerUser.values())
    .filter(c => c.score >= 30)               // Minimum 30% to be a meaningful match
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
