// ─── Job Categories & Titles (5-language support) ───────
// DB stores the `key` (Albanian title). Display uses locale-aware labels.

export type Locale = 'de' | 'en' | 'fr' | 'it' | 'sq';

export interface JobTitle {
  key: string;
  labels: Record<Locale, string>;
}

export interface JobCategory {
  slug: string;
  icon: string;
  labels: Record<Locale, string>;
  titles: JobTitle[];
}

const T = (sq: string, de: string, en: string, fr: string, it: string): JobTitle => ({
  key: sq, labels: { sq, de, en, fr, it },
});

export const JOB_CATEGORIES: JobCategory[] = [
  // ── 1. Kujdes Social & Pastrim ──
  {
    slug: 'care-cleaning', icon: '🧹',
    labels: { sq: 'Kujdes Social & Pastrim', de: 'Soziale Betreuung & Reinigung', en: 'Social Care & Cleaning', fr: 'Soins Sociaux & Nettoyage', it: 'Assistenza Sociale & Pulizia' },
    titles: [
      T('Kujdestare për të moshuar', 'Altenpfleger/in', 'Elderly Caregiver', 'Aide aux personnes âgées', 'Assistente per anziani'),
      T('Kujdestare për fëmije', 'Kinderbetreuer/in', 'Childcare Worker', 'Garde d\'enfants', 'Babysitter'),
      T('Asistent për persona me aftësi të kufizuara', 'Behindertenbetreuer/in', 'Disability Care Assistant', 'Assistant pour personnes handicapées', 'Assistente per disabili'),
      T('Kujdestar për persona me sëmundje kronike / Alzheimer', 'Pfleger/in (chronisch Kranke/Alzheimer)', 'Chronic Illness / Alzheimer Caregiver', 'Aide maladies chroniques / Alzheimer', 'Assistente malattie croniche / Alzheimer'),
      T('Infermier/e shtëpiak', 'Hauskrankenpfleger/in', 'Home Nurse', 'Infirmier/ère à domicile', 'Infermiere/a domiciliare'),
      T('Asistent për terapi fizike në shtëpi', 'Physiotherapie-Assistent/in (Haus)', 'Home Physiotherapy Assistant', 'Assistant physiothérapie à domicile', 'Assistente fisioterapia domiciliare'),
      T('Pastruese shtepie/zyrash/dyqanesh', 'Reinigungskraft (Haus/Büro/Geschäft)', 'House/Office/Shop Cleaner', 'Agent de nettoyage (maison/bureau)', 'Addetto/a pulizie (casa/ufficio)'),
      T('Pastruese shkollash/spitalesh', 'Reinigungskraft (Schule/Spital)', 'School/Hospital Cleaner', 'Agent de nettoyage (école/hôpital)', 'Addetto/a pulizie (scuola/ospedale)'),
      T('Operatore pastrimi në qendra tregtare', 'Reinigungskraft (Einkaufszentrum)', 'Shopping Center Cleaner', 'Agent de nettoyage (centre commercial)', 'Operatore pulizie centro commerciale'),
      T('Pastrues/e xhamash', 'Glasreiniger/in', 'Window Cleaner', 'Laveur/euse de vitres', 'Lavavetri'),
      T('Pastrues/e tapicerish', 'Polsterreiniger/in', 'Upholstery Cleaner', 'Nettoyeur de tapisseries', 'Pulitore tappezzeria'),
      T('Punëtor për pastrim gjelbërimi', 'Grünflächenpfleger/in', 'Green Area Maintenance Worker', 'Agent entretien espaces verts', 'Addetto/a pulizia aree verdi'),
      T('Hekurosje', 'Bügler/in', 'Ironing Worker', 'Repasseur/euse', 'Stiratore/trice'),
      T('Punëtor/e lavanderie', 'Wäschereiarbeiter/in', 'Laundry Worker', 'Employé de blanchisserie', 'Addetto/a lavanderia'),
      T('Lavazhier (pastrim automjetesh)', 'Autowaschanlage-Mitarbeiter/in', 'Car Wash Worker', 'Laveur de voitures', 'Addetto/a autolavaggio'),
      T('Dado (Nanny)', 'Nanny / Kinderfrau', 'Nanny', 'Nounou', 'Tata'),
      T('Babysiter', 'Babysitter', 'Babysitter', 'Baby-sitter', 'Babysitter'),
    ],
  },
  // ── 2. Ndërtim & Inxhinieri (Construction & Engineering) ──
  {
    slug: 'construction-engineering', icon: '🏗️',
    labels: { sq: 'Ndërtim & Inxhinieri', de: 'Bau & Ingenieurwesen', en: 'Construction & Engineering', fr: 'Construction & Ingénierie', it: 'Edilizia & Ingegneria' },
    titles: [
      T('Murator', 'Maurer', 'Bricklayer', 'Maçon', 'Muratore'),
      T('Betonues', 'Betonierer', 'Concrete Worker', 'Bétonneur', 'Operaio calcestruzzo'),
      T('Montues Skelash', 'Gerüstbauer', 'Scaffolder', 'Monteur d\'échafaudages', 'Montatore ponteggi'),
      T('Pllakashtrues', 'Fliesenleger/in', 'Tiler', 'Carreleur', 'Piastrellista'),
      T('Suvatues', 'Verputzer', 'Plasterer', 'Plâtrier', 'Intonacatore'),
      T('Gipser/Suvatues i brendshëm', 'Gipser/in', 'Plasterer (Interior)', 'Plâtrier/ère', 'Gessino/a'),
      T('Bojaxhi Ndërtimi', 'Maler (Bau)', 'Construction Painter', 'Peintre en bâtiment', 'Imbianchino edile'),
      T('Elektricist Ndërtimi', 'Bauelektriker', 'Construction Electrician', 'Électricien du bâtiment', 'Elettricista edile'),
      T('Hidraulik', 'Installateur / Klempner', 'Plumber', 'Plombier', 'Idraulico'),
      T('Instalues HVAC (Ngrohje, Ventilim, Kondicionim)', 'HLK-Installateur', 'HVAC Installer', 'Installateur CVC', 'Installatore HVAC'),
      T('Saldator', 'Schweisser', 'Welder', 'Soudeur', 'Saldatore'),
      T('Specialist Izolimi (Termik / Hidroizolim)', 'Isolierfacharbeiter', 'Insulation Specialist', 'Spécialiste en isolation', 'Specialista isolamento'),
      T('Montues Dyer & Dritare', 'Tür- & Fenstermonteur', 'Door & Window Installer', 'Poseur de portes & fenêtres', 'Installatore porte & finestre'),
      T('Specialist Çatie (Roofing Specialist)', 'Dachdecker', 'Roofing Specialist', 'Couvreur', 'Specialista coperture'),
      T('Operator Eskavatori', 'Baggerführer', 'Excavator Operator', 'Conducteur de pelle', 'Operatore escavatore'),
      T('Operator Vinçi', 'Kranführer', 'Crane Operator', 'Grutier', 'Operatore gru'),
      T('Operator Buldozeri', 'Bulldozerfahrer', 'Bulldozer Operator', 'Conducteur de bulldozer', 'Operatore bulldozer'),
      T('Inxhinier Ndërtimi', 'Bauingenieur', 'Construction Engineer', 'Ingénieur en construction', 'Ingegnere edile'),
      T('Inxhinier Strukturor', 'Tragwerksplaner', 'Structural Engineer', 'Ingénieur structure', 'Ingegnere strutturale'),
      T('Inxhinier Gjeoteknik', 'Geotechniker', 'Geotechnical Engineer', 'Ingénieur géotechnique', 'Ingegnere geotecnico'),
      T('Inxhinier Hidroteknik', 'Wasserbauingenieur', 'Hydraulic Engineer', 'Ingénieur hydraulique', 'Ingegnere idraulico'),
      T('Arkitekt', 'Architekt', 'Architect', 'Architecte', 'Architetto'),
      T('Menaxher Projekti Ndërtimi', 'Bauprojektleiter', 'Construction Project Manager', 'Chef de projet construction', 'Project Manager edile'),
      T('Menaxher Kantieri', 'Baustellenleiter', 'Site Manager', 'Chef de chantier', 'Direttore di cantiere'),
      T('Mbikëqyrës Punimesh (Site Supervisor)', 'Baustellenaufseher', 'Site Supervisor', 'Superviseur de chantier', 'Supervisore di cantiere'),
      T('Teknik Ndërtimi', 'Bautechniker', 'Construction Technician', 'Technicien du bâtiment', 'Tecnico edile'),
      T('Topograf (Gjeodez)', 'Vermesser / Geometer', 'Surveyor', 'Géomètre', 'Geometra / Topografo'),
      T('Armaturist', 'Eisenflechter', 'Rebar Worker', 'Ferrailleur', 'Ferraiolo'),
      T('Karpentier (Forma betoni / druri)', 'Zimmermann / Schaler', 'Carpenter / Formworker', 'Charpentier / Coffreur', 'Carpentiere'),
      T('Inxhinier i Sigurisë në Punë', 'Arbeitssicherheitsingenieur', 'Occupational Safety Engineer', 'Ingénieur sécurité au travail', 'Ingegnere sicurezza sul lavoro'),
      T('Kontrollor i Cilësisë në Ndërtim', 'Qualitätskontrolleur (Bau)', 'Construction Quality Controller', 'Contrôleur qualité construction', 'Controllore qualità edile'),
    ],
  },
  // ── 3. Mekanikë / Servis Automjetesh ──
  {
    slug: 'mechanics-vehicle-service', icon: '🔧',
    labels: { sq: 'Mekanikë / Servis Automjetesh', de: 'Mechanik / Fahrzeugservice', en: 'Mechanics / Vehicle Service', fr: 'Mécanique / Service Automobile', it: 'Meccanica / Servizio Veicoli' },
    titles: [
      T('Mekanik makinash', 'Automechaniker/in', 'Car Mechanic', 'Mécanicien automobile', 'Meccanico auto'),
      T('Mekanik kamionash', 'LKW-Mechaniker/in', 'Truck Mechanic', 'Mécanicien poids lourds', 'Meccanico camion'),
      T('Mekanik motorësh', 'Motorradmechaniker/in', 'Motorcycle Mechanic', 'Mécanicien moto', 'Meccanico moto'),
      T('Auto Elektriçist', 'Autoelektriker/in', 'Auto Electrician', 'Électricien automobile', 'Elettrauto'),
      T('Gomisteri / Servis Gomash', 'Reifenservice-Mitarbeiter/in', 'Tire Service Technician', 'Technicien service pneus', 'Gommista'),
      T('Pastrim Profesional Automjeti', 'Professionelle Fahrzeugreinigung', 'Professional Vehicle Cleaning', 'Nettoyage professionnel de véhicules', 'Pulizia professionale veicoli'),
      T('Punëtor për larje makinash (Car Wash Specialist)', 'Autowasch-Spezialist/in', 'Car Wash Specialist', 'Spécialiste lavage auto', 'Specialista lavaggio auto'),
      T('Servis Karrocerie & Lyerje (Body Shop)', 'Karosserie & Lackierung', 'Body Shop & Paint Service', 'Carrosserie & Peinture', 'Carrozzeria & Verniciatura'),
      T('Veshje karrocerie me folie (Car wraping)', 'Fahrzeugfolierung (Car Wrapping)', 'Car Wrapping Specialist', 'Spécialiste covering automobile', 'Specialista car wrapping'),
    ],
  },
  // ── 4. Restorante & Gastronomi ──
  {
    slug: 'restaurants-gastronomy', icon: '🍽️',
    labels: { sq: 'Restorante & Gastronomi', de: 'Restaurants & Gastronomie', en: 'Restaurants & Gastronomy', fr: 'Restaurants & Gastronomie', it: 'Ristoranti & Gastronomia' },
    titles: [
      T('Kuzhinier/e', 'Koch/Köchin', 'Cook', 'Cuisinier/ère', 'Cuoco/a'),
      T('Shef/e Kuzhine', 'Küchenchef/in', 'Head Chef', 'Chef de cuisine', 'Chef di cucina'),
      T('Shef/e Pastiçerie', 'Konditormeister/in', 'Pastry Chef', 'Chef pâtissier/ère', 'Chef pasticcere/a'),
      T('Pastiçier/e', 'Konditor/in', 'Pastry Maker', 'Pâtissier/ère', 'Pasticcere/a'),
      T('Ndihmës Kuzhinier/e', 'Küchenhelfer/in', 'Kitchen Assistant', 'Aide-cuisinier/ère', 'Aiuto cuoco/a'),
      T('Pjata larës', 'Geschirrspüler/in', 'Dishwasher', 'Plongeur/euse', 'Lavapiatti'),
      T('Barista', 'Barista', 'Barista', 'Barista', 'Barista'),
      T('Barman / Mixologist', 'Barkeeper / Mixologe', 'Bartender / Mixologist', 'Barman / Mixologue', 'Barman / Mixologist'),
      T('Kamarier/e', 'Kellner/in', 'Waiter/Waitress', 'Serveur/euse', 'Cameriere/a'),
      T('Host/Hostess', 'Empfangsperson', 'Host/Hostess', 'Hôte/Hôtesse', 'Host/Hostess'),
      T('Sommelier (Ekspert Verërash)', 'Sommelier', 'Sommelier', 'Sommelier', 'Sommelier'),
      T('Menaxher/e Restoranti', 'Restaurantleiter/in', 'Restaurant Manager', 'Gérant de restaurant', 'Responsabile ristorante'),
      T('Menaxher/e Bar', 'Barleiter/in', 'Bar Manager', 'Gérant de bar', 'Responsabile bar'),
      T('Trajner/e Kuzhine', 'Küchentrainer/in', 'Kitchen Trainer', 'Formateur cuisine', 'Formatore cucina'),
      T('Trajner/e Barista', 'Barista-Trainer/in', 'Barista Trainer', 'Formateur barista', 'Formatore barista'),
      T('Konsulent Gastronomie', 'Gastronomieberater/in', 'Gastronomy Consultant', 'Consultant gastronomie', 'Consulente gastronomia'),
      T('Kasap', 'Metzger/in', 'Butcher', 'Boucher/ère', 'Macellaio/a'),
      T('Shofer Dërgese', 'Lieferfahrer/in', 'Delivery Driver', 'Livreur/euse', 'Autista consegne'),
      T('Pizzaiolo', 'Pizzabäcker/in (Pizzaiolo)', 'Pizzaiolo', 'Pizzaiolo', 'Pizzaiolo'),
      T('Shef Sushi', 'Sushi-Koch/Köchin', 'Sushi Chef', 'Chef Sushi', 'Chef Sushi'),
    ],
  },
  // ── 4. Hoteleri & Mikpritje ──
  {
    slug: 'hospitality', icon: '🏨',
    labels: { sq: 'Hoteleri & Mikpritje', de: 'Hotellerie & Gastfreundschaft', en: 'Hospitality & Hotels', fr: 'Hôtellerie & Accueil', it: 'Alberghiero & Ospitalità' },
    titles: [
      T('Recepsionist/e Hoteli', 'Hotelrezeptionist/in', 'Hotel Receptionist', 'Réceptionniste d\'hôtel', 'Receptionist d\'albergo'),
      T('Menaxher/e Hoteli', 'Hotelmanager/in', 'Hotel Manager', 'Directeur d\'hôtel', 'Direttore d\'albergo'),
      T('Pastrues/e Hoteli', 'Hotelreinigungskraft', 'Hotel Housekeeper', 'Femme/valet de chambre', 'Addetto/a pulizie hotel'),
      T('Menaxher/e Eventesh', 'Eventmanager/in', 'Event Manager', 'Organisateur d\'événements', 'Event Manager'),
      T('Agjent Rezervimesh', 'Reservierungsmitarbeiter/in', 'Booking Agent', 'Agent de réservation', 'Addetto/a prenotazioni'),
      T('Guide Turistike', 'Reiseleiter/in', 'Tourist Guide', 'Guide touristique', 'Guida turistica'),
      T('Trajner Turizmi', 'Tourismustrainer/in', 'Tourism Trainer', 'Formateur tourisme', 'Formatore turismo'),
      T('Specialist/e Marketing Turistik', 'Tourismusmarketing-Spezialist/in', 'Tourism Marketing Specialist', 'Spécialiste marketing touristique', 'Specialista marketing turistico'),
      T('Concierge', 'Concierge', 'Concierge', 'Concierge', 'Concierge'),
      T('Menaxher/e SPA / Wellness', 'SPA/Wellness-Manager/in', 'SPA/Wellness Manager', 'Responsable SPA/Wellness', 'Responsabile SPA/Wellness'),
      T('Masazhier/e Hoteli', 'Hotelmasseur/in', 'Hotel Massage Therapist', 'Masseur d\'hôtel', 'Massaggiatore d\'albergo'),
    ],
  },
  // ── 5. Transport & Logjistikë ──
  {
    slug: 'transport-logistics', icon: '🚚',
    labels: { sq: 'Transport & Logjistikë', de: 'Transport & Logistik', en: 'Transport & Logistics', fr: 'Transport & Logistique', it: 'Trasporto & Logistica' },
    titles: [
      T('Shoferë Transporti', 'Transportfahrer/in', 'Transport Driver', 'Chauffeur de transport', 'Autista di trasporto'),
      T('Menaxher/e Magazine', 'Lagerleiter/in', 'Warehouse Manager', 'Responsable d\'entrepôt', 'Responsabile magazzino'),
      T('Logjistikë & Supply Chain', 'Logistik & Lieferkette', 'Logistics & Supply Chain', 'Logistique & Supply Chain', 'Logistica & Supply Chain'),
      T('Doganë', 'Zollbeamte/r', 'Customs Officer', 'Agent des douanes', 'Doganiere'),
    ],
  },
  // ── 6. Bujqësi & Mjedis ──
  {
    slug: 'agriculture-environment', icon: '🌱',
    labels: { sq: 'Bujqësi & Mjedis', de: 'Landwirtschaft & Umwelt', en: 'Agriculture & Environment', fr: 'Agriculture & Environnement', it: 'Agricoltura & Ambiente' },
    titles: [
      T('Vjelës ullinjsh', 'Olivenernter/in', 'Olive Picker', 'Cueilleur d\'olives', 'Raccoglitore di olive'),
      T('Vjelës portokajsh / agrumesh', 'Zitrusernter/in', 'Citrus Picker', 'Cueilleur d\'agrumes', 'Raccoglitore di agrumi'),
      T('Vjelës rrushi (për verari)', 'Traubenleser/in', 'Grape Picker (Winery)', 'Vendangeur/euse', 'Vendemmiatore/trice'),
      T('Vjelës luleshtrydhesh/domatesh', 'Erdbeer-/Tomatenernter/in', 'Strawberry/Tomato Picker', 'Cueilleur fraises/tomates', 'Raccoglitore fragole/pomodori'),
      T('Punëtor në sera (mbjellje, mirëmbajtje)', 'Gewächshausarbeiter/in', 'Greenhouse Worker', 'Ouvrier en serre', 'Operaio/a in serra'),
      T('Punëtor për pastrim arash pas korrjes', 'Feldarbeiter/in (Nachernte)', 'Post-Harvest Field Worker', 'Ouvrier nettoyage des champs', 'Operaio/a pulizia campi'),
      T('Punëtor për mbjellje sezonale', 'Saisonpflanzarbeiter/in', 'Seasonal Planting Worker', 'Ouvrier plantation saisonnière', 'Operaio/a semina stagionale'),
      T('Punëtor për krasitje pemësh', 'Baumbeschneider/in', 'Tree Pruning Worker', 'Élagueur/euse', 'Potatore/trice'),
      T('Punëtor për paketim frutash & perimesh', 'Obst-/Gemüseverpacker/in', 'Fruit & Vegetable Packer', 'Emballeur fruits & légumes', 'Confezionatore frutta & verdura'),
      T('Seleksionues / klasifikues produktesh bujqësore', 'Sortierer/in (Landwirtschaft)', 'Agricultural Product Sorter', 'Trieur produits agricoles', 'Selezionatore prodotti agricoli'),
      T('Punëtor në magazina bujqësore', 'Landwirtschaftslagerarbeiter/in', 'Agricultural Warehouse Worker', 'Ouvrier entrepôt agricole', 'Magazziniere agricolo'),
      T('Ndihmës në ferma blegtorale', 'Viehwirtschaftshelfer/in', 'Livestock Farm Assistant', 'Aide en ferme d\'élevage', 'Assistente allevamento'),
      T('Kujdestar bagëtish sezonal', 'Saisonaler Tierpfleger', 'Seasonal Livestock Caretaker', 'Gardien bétail saisonnier', 'Pastore stagionale'),
      T('Punëtor në prodhim qumështi sezonal', 'Saisonaler Molkereiarbeiter/in', 'Seasonal Dairy Worker', 'Ouvrier laitier saisonnier', 'Operaio/a caseificio stagionale'),
      T('Punëtor në fidanishte (rritje fidanësh)', 'Baumschularbeiter/in', 'Nursery Worker', 'Ouvrier en pépinière', 'Vivaista'),
      T('Punëtor për sistemet e ujitjes', 'Bewässerungsarbeiter/in', 'Irrigation Worker', 'Ouvrier en irrigation', 'Operaio/a irrigazione'),
      T('Pastrues pyjor / mirëmbajtje zonash rurale', 'Waldpfleger/in', 'Forest Maintenance Worker', 'Agent entretien forestier', 'Addetto manutenzione forestale'),
      T('Punëtor në plantacione (kivi, pjeshkë, mollë)', 'Plantagenarbeiter/in', 'Plantation Worker', 'Ouvrier en plantation', 'Operaio/a in piantagione'),
      T('Punëtor për korrje patatesh & qepësh', 'Kartoffel-/Zwiebel-Erntehelfer/in', 'Potato & Onion Harvester', 'Récolteur pommes de terre & oignons', 'Raccoglitore patate & cipolle'),
      T('Fermer (Bimor)', 'Landwirt/in (Pflanzenbau)', 'Farmer (Crop)', 'Agriculteur (végétal)', 'Agricoltore (vegetale)'),
      T('Blegtor', 'Viehzüchter/in', 'Livestock Farmer', 'Éleveur/euse', 'Allevatore/trice'),
      T('Agronom', 'Agronom/in', 'Agronomist', 'Agronome', 'Agronomo/a'),
      T('Veteriner', 'Tierarzt/Tierärztin', 'Veterinarian', 'Vétérinaire', 'Veterinario/a'),
      T('Specialist i Ujitjes & Sistemeve të Vaditjes', 'Bewässerungsspezialist/in', 'Irrigation Systems Specialist', 'Spécialiste en irrigation', 'Specialista irrigazione'),
      T('Konsulent për Mbrojtjen e Bimëve', 'Pflanzenschutzberater/in', 'Plant Protection Consultant', 'Consultant protection des plantes', 'Consulente protezione piante'),
      T('Specialist i Serave', 'Gewächshausspezialist/in', 'Greenhouse Specialist', 'Spécialiste en serres', 'Specialista serre'),
      T('Menaxher Ferme', 'Farmmanager/in', 'Farm Manager', 'Gérant de ferme', 'Responsabile fattoria'),
      T('Teknik i Makinerive Bujqësore', 'Landmaschinentechniker/in', 'Agricultural Machinery Technician', 'Technicien machines agricoles', 'Tecnico macchinari agricoli'),
      T('Specialist i Mjedisit', 'Umweltspezialist/in', 'Environmental Specialist', 'Spécialiste environnement', 'Specialista ambientale'),
      T('Konsulent për Menaxhimin e Mbetjeve', 'Abfallmanagementberater/in', 'Waste Management Consultant', 'Consultant gestion des déchets', 'Consulente gestione rifiuti'),
      T('Ekspert për Energji të Rinovueshme (Solare/Biomasa)', 'Experte erneuerbare Energien', 'Renewable Energy Expert', 'Expert énergies renouvelables', 'Esperto energie rinnovabili'),
      T('Specialist i Kontrollit të Cilësisë së Produkteve Bujqësore', 'Qualitätskontrolle (Landwirtschaft)', 'Agricultural Quality Control Specialist', 'Spécialiste contrôle qualité agricole', 'Specialista controllo qualità agricolo'),
      T('Inspektor Ushqimor', 'Lebensmittelinspektor/in', 'Food Inspector', 'Inspecteur alimentaire', 'Ispettore alimentare'),
      T('Specialist për Bujqësi Organike', 'Bio-Landwirtschaftsspezialist/in', 'Organic Farming Specialist', 'Spécialiste agriculture biologique', 'Specialista agricoltura biologica'),
      T('Gjeolog Mjedisor', 'Umweltgeologe/in', 'Environmental Geologist', 'Géologue environnemental', 'Geologo ambientale'),
      T('Biolog Mjedisor', 'Umweltbiologe/in', 'Environmental Biologist', 'Biologiste environnemental', 'Biologo ambientale'),
    ],
  },
  // ── 7. Retail & Shërbim ndaj Klientit ──
  {
    slug: 'retail-customer-service', icon: '🛍️',
    labels: { sq: 'Retail & Shërbim ndaj Klientit', de: 'Einzelhandel & Kundenservice', en: 'Retail & Customer Service', fr: 'Commerce & Service Client', it: 'Vendita & Servizio Clienti' },
    titles: [
      T('Shitës/e', 'Verkäufer/in', 'Sales Associate', 'Vendeur/euse', 'Commesso/a'),
      T('Arkëtar/e', 'Kassierer/in', 'Cashier', 'Caissier/ère', 'Cassiere/a'),
      T('Menaxher/e Dyqani', 'Filialleiter/in', 'Store Manager', 'Gérant de magasin', 'Responsabile negozio'),
      T('Operator/e Call Center Gjermanisht', 'Call-Center-Agent (Deutsch)', 'Call Center Agent (German)', 'Agent centre d\'appels (allemand)', 'Operatore call center (tedesco)'),
      T('Operator/e Call Center Italisht', 'Call-Center-Agent (Italienisch)', 'Call Center Agent (Italian)', 'Agent centre d\'appels (italien)', 'Operatore call center (italiano)'),
      T('Operator/e Call Center Anglisht', 'Call-Center-Agent (Englisch)', 'Call Center Agent (English)', 'Agent centre d\'appels (anglais)', 'Operatore call center (inglese)'),
      T('Operator/e Call Center Frengjisht', 'Call-Center-Agent (Französisch)', 'Call Center Agent (French)', 'Agent centre d\'appels (français)', 'Operatore call center (francese)'),
      T('Shitës/e me Komisione', 'Verkäufer/in mit Provisionsmodell', 'Commission-Based Sales Associate', 'Vendeur/euse à commission', 'Venditore/trice a provvigione'),
    ],
  },
  // ── 7b. Siguri & Mbrojtje (Security & Protection) ──
  {
    slug: 'security-protection', icon: '🛡️',
    labels: { sq: 'Siguri & Mbrojtje', de: 'Sicherheit & Schutz', en: 'Security & Protection', fr: 'Sécurité & Protection', it: 'Sicurezza & Protezione' },
    titles: [
      T('Siguri Objektesh (ndërtesa, biznese, banesa)', 'Objektschutz (Gebäude, Betriebe, Wohnhäuser)', 'Facility Security (Buildings, Businesses, Residences)', 'Sécurité des installations (bâtiments, entreprises, résidences)', 'Sicurezza strutture (edifici, aziende, residenze)'),
      T('Siguri në Dyqane', 'Kaufhausdetektiv/in / Ladenüberwachung', 'Store Security', 'Sécurité en magasin', 'Sicurezza nei negozi'),
      T('Siguri në Evente', 'Veranstaltungssicherheit', 'Event Security', 'Sécurité événementielle', 'Sicurezza eventi'),
      T('Kontroll Hyrje-Dalje (Portier)', 'Zutrittskontrolle (Pförtner)', 'Entry-Exit Control (Gate Security)', 'Contrôle d\'accès (gardien)', 'Controllo accessi (portineria)'),
      T('Operator Kamerash (CCTV)', 'Videoüberwachungsoperator/in (CCTV)', 'CCTV Operator (Camera Monitoring)', 'Opérateur vidéosurveillance (CCTV)', 'Operatore videosorveglianza (CCTV)'),
      T('Roje Nate', 'Nachtwächter/in', 'Night Watchman', 'Veilleur/euse de nuit', 'Guardiano/a notturno/a'),
      T('Patrullues (Patrullë Lëvizëse)', 'Streifenwächter/in (Mobile Patrouille)', 'Patroller (Mobile Patrol)', 'Patrouilleur/euse (patrouille mobile)', 'Pattugliatore/trice (pattuglia mobile)'),
      T('Truproje', 'Personenschützer/in (Bodyguard)', 'Bodyguard', 'Garde du corps', 'Guardia del corpo'),
      T('Roje Sigurie', 'Sicherheitsmitarbeiter/in', 'Security Guard', 'Agent de sécurité', 'Guardia di sicurezza'),
    ],
  },
  // ── 8. Estetikë & Bukuri ──
  {
    slug: 'aesthetics-beauty', icon: '💅',
    labels: { sq: 'Estetikë & Bukuri', de: 'Ästhetik & Schönheit', en: 'Aesthetics & Beauty', fr: 'Esthétique & Beauté', it: 'Estetica & Bellezza' },
    titles: [
      T('Estetist/e', 'Kosmetiker/in', 'Aesthetician', 'Esthéticien/ne', 'Estetista'),
      T('Kozmetolog/e', 'Kosmetologe/in', 'Cosmetologist', 'Cosmétologue', 'Cosmetologo/a'),
      T('Make-up Artist/e', 'Make-up Artist', 'Makeup Artist', 'Maquilleur/euse', 'Makeup Artist'),
      T('Makeup Artist për Dasma', 'Hochzeits-Make-up-Artist', 'Wedding Makeup Artist', 'Maquilleur mariage', 'Makeup Artist matrimoni'),
      T('Makeup Artist për TV & Film', 'TV & Film Make-up-Artist', 'TV & Film Makeup Artist', 'Maquilleur TV & cinéma', 'Makeup Artist TV & cinema'),
      T('Artist për Grim Permanent (PMU)', 'Permanent-Make-up-Spezialist/in', 'Permanent Makeup Artist (PMU)', 'Spécialiste maquillage permanent', 'Specialista trucco permanente'),
      T('Teknik i Mikroblading', 'Microblading-Techniker/in', 'Microblading Technician', 'Technicien microblading', 'Tecnico microblading'),
      T('Specialist/e i Zgjatjes së Qerpikëve', 'Wimpernverlängerungsspezialist/in', 'Eyelash Extension Specialist', 'Spécialiste extensions de cils', 'Specialista extension ciglia'),
      T('Teknik për Laminim Qerpikësh', 'Wimpernlaminierungstechniker/in', 'Lash Lamination Technician', 'Technicien lamination de cils', 'Tecnico laminazione ciglia'),
      T('Stilist/e Vetullash', 'Augenbrauen-Stylist/in', 'Brow Stylist', 'Styliste de sourcils', 'Stilista sopracciglia'),
      T('Manikyrist/e', 'Manikürist/in', 'Manicurist', 'Manucure', 'Manicurista'),
      T('Pedikyrist/e', 'Pedikürist/in', 'Pedicurist', 'Pédicure', 'Pedicurista'),
      T('Nail Artist (Teknik i Thonjve Gel/Akrilik)', 'Nageldesigner/in', 'Nail Artist (Gel/Acrylic)', 'Prothésiste ongulaire', 'Nail Artist (gel/acrilico)'),
      T('Parukier/e', 'Friseur/in', 'Hairdresser', 'Coiffeur/euse', 'Parrucchiere/a'),
      T('Berber/e', 'Barbier', 'Barber', 'Barbier', 'Barbiere'),
      T('Trajtues Keratine për Flokë', 'Keratinbehandlungsspezialist/in', 'Keratin Hair Treatment Specialist', 'Spécialiste traitement kératine', 'Specialista trattamento cheratina'),
      T('Terapist/e i Lëkurës (Skin Care Specialist)', 'Hauttherapeut/in', 'Skin Care Specialist', 'Spécialiste soins de la peau', 'Specialista cura della pelle'),
      T('Facial Specialist', 'Gesichtsbehandlungsspezialist/in', 'Facial Specialist', 'Spécialiste soins du visage', 'Specialista trattamenti viso'),
      T('Terapist SPA', 'SPA-Therapeut/in', 'SPA Therapist', 'Thérapeute SPA', 'Terapista SPA'),
      T('Masazhist/e', 'Masseur/in', 'Massage Therapist', 'Masseur/euse', 'Massaggiatore/trice'),
      T('Teknik Depilimi me Dyll', 'Wachsepilationstechniker/in', 'Waxing Technician', 'Technicien épilation cire', 'Tecnico epilazione cera'),
      T('Teknik Depilimi me Laser', 'Laserepilationstechniker/in', 'Laser Hair Removal Technician', 'Technicien épilation laser', 'Tecnico epilazione laser'),
      T('Specialist për Trajtime Anti-Aging', 'Anti-Aging-Spezialist/in', 'Anti-Aging Treatment Specialist', 'Spécialiste anti-âge', 'Specialista trattamenti anti-aging'),
      T('Konsulent/e Bukurie', 'Schönheitsberater/in', 'Beauty Consultant', 'Conseiller beauté', 'Consulente di bellezza'),
      T('Teknik për Solarium', 'Solariumtechniker/in', 'Solarium Technician', 'Technicien solarium', 'Tecnico solarium'),
      T('Trajner Profesional në Estetikë', 'Ausbilder/in Kosmetik', 'Professional Aesthetics Trainer', 'Formateur esthétique', 'Formatore estetica'),
      T('Menaxher/e Salloni Bukurie', 'Schönheitssalonleiter/in', 'Beauty Salon Manager', 'Gérant salon de beauté', 'Responsabile salone di bellezza'),
    ],
  },
  // ── 9. Kurse për Fëmijë & te rritur ──
  {
    slug: 'courses', icon: '📚',
    labels: { sq: 'Kurse për Fëmijë & te rritur', de: 'Kurse für Kinder & Erwachsene', en: 'Courses for Children & Adults', fr: 'Cours pour Enfants & Adultes', it: 'Corsi per Bambini & Adulti' },
    titles: [
      T('Kurs i Gjuhës Angleze', 'Englischkurs', 'English Language Course', 'Cours d\'anglais', 'Corso di inglese'),
      T('Kurs i Gjuhës Gjermane', 'Deutschkurs', 'German Language Course', 'Cours d\'allemand', 'Corso di tedesco'),
      T('Kurs i Gjuhës Italiane', 'Italienischkurs', 'Italian Language Course', 'Cours d\'italien', 'Corso di italiano'),
      T('Kurs i Gjuhës Frënge', 'Französischkurs', 'French Language Course', 'Cours de français', 'Corso di francese'),
      T('Kurs i Matematikës', 'Mathematikkurs', 'Mathematics Course', 'Cours de mathématiques', 'Corso di matematica'),
      T('Kurs i Leximit dhe Shkrimit', 'Lese- und Schreibkurs', 'Reading & Writing Course', 'Cours de lecture et écriture', 'Corso di lettura e scrittura'),
      T('Kurs i Robotikës', 'Robotikkurs', 'Robotics Course', 'Cours de robotique', 'Corso di robotica'),
      T('Kurs i Kodimit me Scratch', 'Scratch-Programmierkurs', 'Scratch Coding Course', 'Cours de codage Scratch', 'Corso di coding Scratch'),
      T('Kurs i Pikturës', 'Malkurs', 'Painting Course', 'Cours de peinture', 'Corso di pittura'),
      T('Kurs i Sklupturës', 'Bildhauerkurs', 'Sculpture Course', 'Cours de sculpture', 'Corso di scultura'),
      T('Kurs i Vizatim-it', 'Zeichenkurs', 'Drawing Course', 'Cours de dessin', 'Corso di disegno'),
      T('Kurs i Artizanatit', 'Handwerkskurs', 'Crafts Course', 'Cours d\'artisanat', 'Corso di artigianato'),
      T('Kurs i Muzikës për Fëmijë', 'Kindermusikunterricht', 'Music Course for Children', 'Cours de musique pour enfants', 'Corso di musica per bambini'),
      T('Kurs i Pianos', 'Klavierunterricht', 'Piano Course', 'Cours de piano', 'Corso di pianoforte'),
      T('Kurs i Kitares', 'Gitarrenunterricht', 'Guitar Course', 'Cours de guitare', 'Corso di chitarra'),
      T('Kurs i Harpës', 'Harfenunterricht', 'Harp Course', 'Cours de harpe', 'Corso di arpa'),
      T('Kurs i Violinës', 'Geigenunterricht', 'Violin Course', 'Cours de violon', 'Corso di violino'),
      T('Kurs i Këndimit', 'Gesangsunterricht', 'Singing Course', 'Cours de chant', 'Corso di canto'),
      T('Kurs i Baletit', 'Ballettkurs', 'Ballet Course', 'Cours de ballet', 'Corso di balletto'),
      T('Kurs i Valleve Moderne', 'Kurs für modernen Tanz', 'Modern Dance Course', 'Cours de danse moderne', 'Corso di danza moderna'),
      T('Kurs i Teatrit për Fëmijë', 'Kindertheater-Kurs', 'Children\'s Theater Course', 'Cours de théâtre pour enfants', 'Corso di teatro per bambini'),
      T('Kurs i Aktrimit', 'Schauspielkurs', 'Acting Course', 'Cours de théâtre', 'Corso di recitazione'),
      T('Kurs i Shkrimit Kreativ', 'Kreativschreibkurs', 'Creative Writing Course', 'Cours d\'écriture créative', 'Corso di scrittura creativa'),
      T('Kurs i Tenisit', 'Tenniskurs', 'Tennis Course', 'Cours de tennis', 'Corso di tennis'),
      T('Kurs i Voleybollit', 'Volleyballkurs', 'Volleyball Course', 'Cours de volleyball', 'Corso di pallavolo'),
      T('Kurs për arte marziale', 'Kampfsportkurs', 'Martial Arts Course', 'Cours d\'arts martiaux', 'Corso di arti marziali'),
      T('Kurs i Shkencës për Fëmijë', 'Wissenschaftskurs für Kinder', 'Science Course for Children', 'Cours de sciences pour enfants', 'Corso di scienze per bambini'),
      T('Kurs i Eksperimenteve Shkencore', 'Kurs wissenschaftliche Experimente', 'Science Experiments Course', 'Cours d\'expériences scientifiques', 'Corso di esperimenti scientifici'),
      T('Kurs i Astronomisë', 'Astronomiekurs', 'Astronomy Course', 'Cours d\'astronomie', 'Corso di astronomia'),
      T('Kurs i Shahut', 'Schachkurs', 'Chess Course', 'Cours d\'échecs', 'Corso di scacchi'),
      T('Kurs i Lojërave Logjike', 'Logikspielkurs', 'Logic Games Course', 'Cours de jeux logiques', 'Corso di giochi logici'),
      T('Kurs i Gatimit për Fëmijë', 'Kochkurs für Kinder', 'Cooking Course for Children', 'Cours de cuisine pour enfants', 'Corso di cucina per bambini'),
      T('Kurs i IT për Fillestarë', 'IT-Anfängerkurs', 'IT for Beginners Course', 'Cours IT pour débutants', 'Corso IT per principianti'),
      T('Kurs i Programimit', 'Programmierkurs', 'Programming Course', 'Cours de programmation', 'Corso di programmazione'),
      T('Kurs i Web Development', 'Webentwicklungskurs', 'Web Development Course', 'Cours de développement web', 'Corso di sviluppo web'),
      T('Kurs i Graphic Design', 'Grafikdesignkurs', 'Graphic Design Course', 'Cours de design graphique', 'Corso di graphic design'),
      T('Kurs i Digital Marketing', 'Digital-Marketing-Kurs', 'Digital Marketing Course', 'Cours de marketing digital', 'Corso di marketing digitale'),
      T('Kurs i Video Editing', 'Videobearbeitungskurs', 'Video Editing Course', 'Cours de montage vidéo', 'Corso di video editing'),
      T('Kurs i Fotografi-së', 'Fotokurs', 'Photography Course', 'Cours de photographie', 'Corso di fotografia'),
      T('Kurs i Kontabilitetit', 'Buchhaltungskurs', 'Accounting Course', 'Cours de comptabilité', 'Corso di contabilità'),
      T('Kurs i Excel-it Profesional', 'Professioneller Excel-Kurs', 'Professional Excel Course', 'Cours Excel professionnel', 'Corso di Excel professionale'),
      T('Kurs i Menaxhimit të Biznesit', 'Betriebswirtschaftskurs', 'Business Management Course', 'Cours de gestion d\'entreprise', 'Corso di gestione aziendale'),
      T('Kurs i Sipërmarrjes', 'Unternehmerkurs', 'Entrepreneurship Course', 'Cours d\'entrepreneuriat', 'Corso di imprenditorialità'),
      T('Kurs i Public Speaking', 'Kurs öffentliches Sprechen', 'Public Speaking Course', 'Cours de prise de parole', 'Corso di public speaking'),
      T('Kurs i Gatimit Profesional', 'Professioneller Kochkurs', 'Professional Cooking Course', 'Cours de cuisine professionnelle', 'Corso di cucina professionale'),
      T('Kurs i Pasticerisë', 'Konditorei-Kurs', 'Pastry Course', 'Cours de pâtisserie', 'Corso di pasticceria'),
      T('Kurs i Makeup-it Profesional', 'Professioneller Make-up-Kurs', 'Professional Makeup Course', 'Cours de maquillage professionnel', 'Corso di makeup professionale'),
      T('Kurs i Hair Styling', 'Haarstyling-Kurs', 'Hair Styling Course', 'Cours de coiffure', 'Corso di hair styling'),
      T('Kurs i Nail Art', 'Nail-Art-Kurs', 'Nail Art Course', 'Cours de nail art', 'Corso di nail art'),
      T('Kurs i Fitness-it', 'Fitnesskurs', 'Fitness Course', 'Cours de fitness', 'Corso di fitness'),
      T('Kurs i Yogës', 'Yogakurs', 'Yoga Course', 'Cours de yoga', 'Corso di yoga'),
      T('Kurs i Meditimit', 'Meditationskurs', 'Meditation Course', 'Cours de méditation', 'Corso di meditazione'),
      T('Kurs i Zhvillimit Personal', 'Kurs persönliche Entwicklung', 'Personal Development Course', 'Cours de développement personnel', 'Corso di sviluppo personale'),
      T('Kurs i Menaxhimit të Kohës', 'Zeitmanagementkurs', 'Time Management Course', 'Cours de gestion du temps', 'Corso di gestione del tempo'),
    ],
  },
  // ── 10. Arsim & Trajnim ──
  {
    slug: 'education-training', icon: '🎓',
    labels: { sq: 'Arsim & Trajnim', de: 'Bildung & Training', en: 'Education & Training', fr: 'Éducation & Formation', it: 'Istruzione & Formazione' },
    titles: [
      T('Edukatore kopshti / çerdhe', 'Kindergärtner/in', 'Kindergarten/Nursery Teacher', 'Éducateur de crèche/maternelle', 'Educatore d\'asilo'),
      T('Mësues i Arsimit Fillor', 'Grundschullehrer/in', 'Primary School Teacher', 'Instituteur/trice', 'Insegnante scuola primaria'),
      T('Mësues i Gjuhës Shqipe', 'Albanischlehrer/in', 'Albanian Language Teacher', 'Professeur de langue albanaise', 'Insegnante di albanese'),
      T('Mësues i Matematikës', 'Mathematiklehrer/in', 'Mathematics Teacher', 'Professeur de mathématiques', 'Insegnante di matematica'),
      T('Mësues i Fizikës', 'Physiklehrer/in', 'Physics Teacher', 'Professeur de physique', 'Insegnante di fisica'),
      T('Mësues i Kimisë', 'Chemielehrer/in', 'Chemistry Teacher', 'Professeur de chimie', 'Insegnante di chimica'),
      T('Mësues i Biologjisë', 'Biologielehrer/in', 'Biology Teacher', 'Professeur de biologie', 'Insegnante di biologia'),
      T('Mësues i Historisë', 'Geschichtslehrer/in', 'History Teacher', 'Professeur d\'histoire', 'Insegnante di storia'),
      T('Mësues i Gjeografisë', 'Geographielehrer/in', 'Geography Teacher', 'Professeur de géographie', 'Insegnante di geografia'),
      T('Mësues i Gjuhës Angleze', 'Englischlehrer/in', 'English Teacher', 'Professeur d\'anglais', 'Insegnante di inglese'),
      T('Mësues i Gjuhës Gjermane', 'Deutschlehrer/in', 'German Teacher', 'Professeur d\'allemand', 'Insegnante di tedesco'),
      T('Mësues i Gjuhës Italiane', 'Italienischlehrer/in', 'Italian Teacher', 'Professeur d\'italien', 'Insegnante di italiano'),
      T('Mësues i Gjuhës Frënge', 'Französischlehrer/in', 'French Teacher', 'Professeur de français', 'Insegnante di francese'),
      T('Mësues i Edukimit Fizik', 'Sportlehrer/in', 'Physical Education Teacher', 'Professeur d\'éducation physique', 'Insegnante di educazione fisica'),
      T('Mësues i Muzikës', 'Musiklehrer/in', 'Music Teacher', 'Professeur de musique', 'Insegnante di musica'),
      T('Psikolog Shkollor', 'Schulpsychologe/in', 'School Psychologist', 'Psychologue scolaire', 'Psicologo scolastico'),
      T('Pedagog Universitar', 'Universitätsdozent/in', 'University Lecturer', 'Pédagogue universitaire', 'Docente universitario'),
      T('Asistent Pedagog', 'Lehrassistent/in', 'Teaching Assistant', 'Assistant pédagogique', 'Assistente didattico'),
      T('Lektor Gjuhësh të Huaja', 'Fremdsprachenlektor/in', 'Foreign Language Lecturer', 'Lecteur de langues étrangères', 'Lettore di lingue straniere'),
      T('Trajner Profesional (Soft Skills)', 'Soft-Skills-Trainer/in', 'Professional Trainer (Soft Skills)', 'Formateur professionnel (soft skills)', 'Formatore professionale (soft skills)'),
      T('Trajner IT', 'IT-Trainer/in', 'IT Trainer', 'Formateur IT', 'Formatore IT'),
      T('Instruktor Programimi', 'Programmierinstruktor/in', 'Programming Instructor', 'Instructeur programmation', 'Istruttore programmazione'),
      T('Instruktor i Kurseve Profesionale', 'Berufsbildungsinstruktor/in', 'Professional Course Instructor', 'Instructeur cours professionnels', 'Istruttore corsi professionali'),
      T('Koordinator Akademik', 'Akademischer Koordinator/in', 'Academic Coordinator', 'Coordinateur académique', 'Coordinatore accademico'),
      T('Drejtor Shkolle', 'Schulleiter/in', 'School Principal', 'Directeur d\'école', 'Preside'),
      T('Zëvendësdrejtor Shkolle', 'Stellv. Schulleiter/in', 'Vice Principal', 'Directeur adjoint', 'Vice preside'),
      T('Këshilltar Karriere', 'Berufsberater/in', 'Career Counselor', 'Conseiller de carrière', 'Consulente di carriera'),
      T('Specialist për Zhvillim Kurrikule', 'Curriculumentwickler/in', 'Curriculum Development Specialist', 'Spécialiste développement programmes', 'Specialista sviluppo curricolare'),
      T('Tutor Privat', 'Privatlehrer/in', 'Private Tutor', 'Tuteur privé', 'Tutor privato'),
      T('Mentor Akademik', 'Akademischer Mentor/in', 'Academic Mentor', 'Mentor académique', 'Mentore accademico'),
      T('Instruktor Autoshkolle', 'Fahrlehrer/in', 'Driving School Instructor', 'Moniteur d\'auto-école', 'Istruttore di scuola guida'),
      T('Instruktor Fitness / Edukim Sportiv', 'Fitness-/Sportinstruktor/in', 'Fitness/Sports Instructor', 'Instructeur fitness/sport', 'Istruttore fitness/sport'),
      T('Trajner për Siguri në Punë', 'Arbeitssicherheitstrainer/in', 'Occupational Safety Trainer', 'Formateur sécurité au travail', 'Formatore sicurezza sul lavoro'),
      T('Specialist i Edukimit Special', 'Sonderpädagoge/in', 'Special Education Specialist', 'Spécialiste éducation spécialisée', 'Specialista educazione speciale'),
      T('Logoped (terapist i të folurit)', 'Logopäde/in', 'Speech Therapist', 'Orthophoniste', 'Logopedista'),
      T('Edukator Social', 'Sozialpädagoge/in', 'Social Educator', 'Éducateur social', 'Educatore sociale'),
      T('Instruktor Muzike', 'Musikinstruktor/in', 'Music Instructor', 'Instructeur de musique', 'Istruttore di musica'),
      T('Instruktor Vallëzimi', 'Tanzlehrer/in', 'Dance Instructor', 'Instructeur de danse', 'Istruttore di danza'),
      T('Konsulent Edukimi', 'Bildungsberater/in', 'Education Consultant', 'Consultant en éducation', 'Consulente educativo'),
      T('Koordinator Projektesh Edukative', 'Bildungsprojektkoordinator/in', 'Educational Project Coordinator', 'Coordinateur projets éducatifs', 'Coordinatore progetti educativi'),
      T('Specialist për E-learning', 'E-Learning-Spezialist/in', 'E-Learning Specialist', 'Spécialiste e-learning', 'Specialista e-learning'),
      T('Administrator Shkolle', 'Schulverwalter/in', 'School Administrator', 'Administrateur scolaire', 'Amministratore scolastico'),
      T('Mbikëqyrës Provimesh', 'Prüfungsaufseher/in', 'Exam Supervisor', 'Surveillant d\'examens', 'Sorvegliante esami'),
      T('Trajner për Zhvillim Personal', 'Trainer persönliche Entwicklung', 'Personal Development Trainer', 'Formateur développement personnel', 'Formatore sviluppo personale'),
      T('Mësues për Arsimin Profesional (zanate)', 'Berufsbildungslehrer/in', 'Vocational Education Teacher', 'Enseignant formation professionnelle', 'Insegnante formazione professionale'),
      T('Specialist për Trajnime Online', 'Online-Trainingspezialist/in', 'Online Training Specialist', 'Spécialiste formations en ligne', 'Specialista formazione online'),
    ],
  },
  // ── 11. Prodhim & Industri ──
  {
    slug: 'manufacturing-industry', icon: '🏭',
    labels: { sq: 'Prodhim & Industri', de: 'Produktion & Industrie', en: 'Manufacturing & Industry', fr: 'Production & Industrie', it: 'Produzione & Industria' },
    titles: [
      T('Operatorë Prodhimi', 'Produktionsmitarbeiter/in', 'Production Operator', 'Opérateur de production', 'Operatore di produzione'),
      T('Menaxhim Fabrike', 'Fabrikmanagement', 'Factory Management', 'Gestion d\'usine', 'Gestione fabbrica'),
      T('Kontroll Cilësie', 'Qualitätskontrolle', 'Quality Control', 'Contrôle qualité', 'Controllo qualità'),
      T('Mirëmbajtje Industriale', 'Industriewartung', 'Industrial Maintenance', 'Maintenance industrielle', 'Manutenzione industriale'),
    ],
  },
  // ── 12. Shëndetësi ──
  {
    slug: 'healthcare', icon: '🏥',
    labels: { sq: 'Shëndetësi', de: 'Gesundheitswesen', en: 'Healthcare', fr: 'Santé', it: 'Sanità' },
    titles: [
      T('Nutricionist & Dietolog', 'Ernährungsberater/in', 'Nutritionist & Dietitian', 'Nutritionniste & Diététicien', 'Nutrizionista & Dietologo'),
      T('Psikolog/e & Mentor Shëndeti', 'Psychologe/in & Gesundheitsmentor', 'Psychologist & Health Mentor', 'Psychologue & Mentor santé', 'Psicologo & Mentore della salute'),
      T('Psikiater/e', 'Psychiater/in', 'Psychiatrist', 'Psychiatre', 'Psichiatra'),
      T('Infermier/e', 'Krankenpfleger/in', 'Nurse', 'Infirmier/ère', 'Infermiere/a'),
      T('Farmacist/e', 'Apotheker/in', 'Pharmacist', 'Pharmacien/ne', 'Farmacista'),
      T('Stomatolog/e', 'Zahnarzt/Zahnärztin', 'Dentist', 'Dentiste', 'Dentista'),
      T('Fizioterapist/e', 'Physiotherapeut/in', 'Physiotherapist', 'Physiothérapeute', 'Fisioterapista'),
      T('Administrim Spitalor', 'Krankenhausverwaltung', 'Hospital Administration', 'Administration hospitalière', 'Amministrazione ospedaliera'),
      T('Mami & Obstetrikë', 'Hebamme', 'Midwife & Obstetrics', 'Sage-femme & Obstétrique', 'Ostetrica'),
      T('Kirurg/e', 'Chirurg/in', 'Surgeon', 'Chirurgien/ne', 'Chirurgo/a'),
      T('Pediater', 'Kinderarzt/ärztin', 'Pediatrician', 'Pédiatre', 'Pediatra'),
      T('Kardiolog/e', 'Kardiologe/in', 'Cardiologist', 'Cardiologue', 'Cardiologo/a'),
      T('Onkolog/e', 'Onkologe/in', 'Oncologist', 'Oncologue', 'Oncologo/a'),
      T('Ergoterapist/e (Terapia Okupacionale)', 'Ergotherapeut/in', 'Occupational Therapist', 'Ergothérapeute', 'Ergoterapista'),
      T('Logopedist/e', 'Logopäde/in', 'Speech Therapist', 'Orthophoniste', 'Logopedista'),
      T('Laborant/e Mjekësor', 'Medizinische/r Labortechniker/in', 'Medical Lab Technician', 'Technicien de laboratoire médical', 'Tecnico di laboratorio medico'),
      T('Radiolog & Imazheri', 'Radiologe/in', 'Radiologist & Imaging', 'Radiologue & Imagerie', 'Radiologo & Diagnostica'),
      T('Anestezist & Reanimacion', 'Anästhesist/in', 'Anesthesiologist & Resuscitation', 'Anesthésiste & Réanimation', 'Anestesista & Rianimazione'),
      T('Urgjencë Mjekësore', 'Notfallmedizin', 'Emergency Medicine', 'Urgences médicales', 'Medicina d\'urgenza'),
      T('Epidemiolog', 'Epidemiologe/in', 'Epidemiologist', 'Épidémiologiste', 'Epidemiologo/a'),
      T('Rehabilitim & Kujdes Afatgjatë', 'Rehabilitation & Langzeitpflege', 'Rehabilitation & Long-Term Care', 'Réhabilitation & Soins longue durée', 'Riabilitazione & Cure a lungo termine'),
    ],
  },
  // ── 13. Teknologji & IT ──
  {
    slug: 'technology-it', icon: '💻',
    labels: { sq: 'Teknologji & IT', de: 'Technologie & IT', en: 'Technology & IT', fr: 'Technologie & IT', it: 'Tecnologia & IT' },
    titles: [
      T('Zhvillim Software (Frontend, Backend, Full-Stack)', 'Softwareentwicklung (Frontend, Backend, Full-Stack)', 'Software Development (Frontend, Backend, Full-Stack)', 'Développement logiciel (Frontend, Backend, Full-Stack)', 'Sviluppo software (Frontend, Backend, Full-Stack)'),
      T('Administrim Sistemi & Rrjete', 'Systemadministration & Netzwerke', 'System Administration & Networks', 'Administration systèmes & Réseaux', 'Amministrazione sistemi & Reti'),
      T('Cybersecurity', 'Cybersicherheit', 'Cybersecurity', 'Cybersécurité', 'Cybersicurezza'),
      T('Data Science & AI', 'Data Science & KI', 'Data Science & AI', 'Data Science & IA', 'Data Science & IA'),
      T('DevOps & Cloud', 'DevOps & Cloud', 'DevOps & Cloud', 'DevOps & Cloud', 'DevOps & Cloud'),
      T('QA & Testing', 'QA & Testing', 'QA & Testing', 'Assurance qualité & Tests', 'QA & Testing'),
      T('UI/UX Design', 'UI/UX Design', 'UI/UX Design', 'Design UI/UX', 'Design UI/UX'),
    ],
  },
  // ── 14. Menaxhim & Administrim ──
  {
    slug: 'management-admin', icon: '💼',
    labels: { sq: 'Menaxhim & Administrim', de: 'Management & Verwaltung', en: 'Management & Administration', fr: 'Management & Administration', it: 'Management & Amministrazione' },
    titles: [
      T('Menaxhim Projektesh', 'Projektmanagement', 'Project Management', 'Gestion de projets', 'Gestione progetti'),
      T('Operacione', 'Operations', 'Operations', 'Opérations', 'Operazioni'),
      T('Administratë', 'Verwaltung', 'Administration', 'Administration', 'Amministrazione'),
      T('Sekretari / Asistente Ekzekutive', 'Sekretariat / Executive Assistant', 'Secretary / Executive Assistant', 'Secrétariat / Assistant exécutif', 'Segreteria / Assistente esecutivo'),
      T('Menaxhim Biznesi', 'Geschäftsführung', 'Business Management', 'Management d\'entreprise', 'Gestione aziendale'),
      T('Punonjës Banke', 'Bankangestellte/r', 'Bank Employee', 'Employé/e de banque', 'Impiegato/a di banca'),
      T('Agjent Sigurimesh', 'Versicherungsvertreter/in', 'Insurance Agent', 'Agent d\'assurance', 'Agente assicurativo/a'),
    ],
  },
  // ── 15. Financë & Kontabilitet ──
  {
    slug: 'finance-accounting', icon: '📊',
    labels: { sq: 'Financë & Kontabilitet', de: 'Finanzen & Buchhaltung', en: 'Finance & Accounting', fr: 'Finance & Comptabilité', it: 'Finanza & Contabilità' },
    titles: [
      T('Kontabilist/e', 'Buchhalter/in', 'Accountant', 'Comptable', 'Contabile'),
      T('Financë & Audit', 'Finanzen & Audit', 'Finance & Audit', 'Finance & Audit', 'Finanza & Audit'),
      T('Bankë & Sigurime', 'Bank & Versicherung', 'Banking & Insurance', 'Banque & Assurance', 'Banca & Assicurazione'),
      T('Analist Financiar', 'Finanzanalyst/in', 'Financial Analyst', 'Analyste financier', 'Analista finanziario'),
      T('Payroll Specialist', 'Lohnbuchhalter/in', 'Payroll Specialist', 'Spécialiste paie', 'Specialista paghe'),
    ],
  },
  // ── 16. Marketing & Shitje ──
  {
    slug: 'marketing-sales', icon: '📢',
    labels: { sq: 'Marketing & Shitje', de: 'Marketing & Vertrieb', en: 'Marketing & Sales', fr: 'Marketing & Ventes', it: 'Marketing & Vendite' },
    titles: [
      T('Marketing Digjital', 'Digitales Marketing', 'Digital Marketing', 'Marketing digital', 'Marketing digitale'),
      T('SEO/SEM', 'SEO/SEM', 'SEO/SEM', 'SEO/SEM', 'SEO/SEM'),
      T('Social Media', 'Social Media', 'Social Media', 'Médias sociaux', 'Social Media'),
      T('Brand Management', 'Markenmanagement', 'Brand Management', 'Gestion de marque', 'Brand Management'),
      T('Shitje B2B / B2C', 'B2B/B2C-Vertrieb', 'B2B/B2C Sales', 'Ventes B2B/B2C', 'Vendite B2B/B2C'),
      T('Customer Success', 'Kundenerfolg', 'Customer Success', 'Succès client', 'Customer Success'),
    ],
  },
  // ── 17. Ligjore & Konsulencë ──
  {
    slug: 'legal-consulting', icon: '⚖️',
    labels: { sq: 'Ligjore & Konsulencë', de: 'Recht & Beratung', en: 'Legal & Consulting', fr: 'Juridique & Conseil', it: 'Legale & Consulenza' },
    titles: [
      T('Jurist', 'Jurist/in', 'Jurist', 'Juriste', 'Giurista'),
      T('Avokat', 'Anwalt/Anwältin', 'Lawyer', 'Avocat/e', 'Avvocato/a'),
      T('Noter', 'Notar/in', 'Notary', 'Notaire', 'Notaio/a'),
      T('Konsulent Biznesi', 'Unternehmensberater/in', 'Business Consultant', 'Consultant d\'entreprise', 'Consulente aziendale'),
    ],
  },
  // ── 18. Kreative & Media ──
  {
    slug: 'creative-media', icon: '🎨',
    labels: { sq: 'Kreative & Media', de: 'Kreativ & Medien', en: 'Creative & Media', fr: 'Créatif & Médias', it: 'Creativo & Media' },
    titles: [
      T('Dizajn Grafik', 'Grafikdesign', 'Graphic Design', 'Design graphique', 'Graphic Design'),
      T('Video Editor', 'Videobearbeitung', 'Video Editor', 'Monteur vidéo', 'Video Editor'),
      T('Fotograf/e', 'Fotograf/in', 'Photographer', 'Photographe', 'Fotografo/a'),
      T('Gazetar/e', 'Journalist/in', 'Journalist', 'Journaliste', 'Giornalista'),
      T('Content Creator', 'Content Creator', 'Content Creator', 'Créateur de contenu', 'Content Creator'),
    ],
  },
  // ── 19. Burime Njerëzore (HR) ──
  {
    slug: 'human-resources', icon: '🏢',
    labels: { sq: 'Burime Njerëzore (HR)', de: 'Personalwesen (HR)', en: 'Human Resources (HR)', fr: 'Ressources Humaines (RH)', it: 'Risorse Umane (HR)' },
    titles: [
      T('Rekrutim', 'Recruiting', 'Recruitment', 'Recrutement', 'Reclutamento'),
      T('HR Business Partner', 'HR Business Partner', 'HR Business Partner', 'HR Business Partner', 'HR Business Partner'),
      T('Trajnim & Zhvillim', 'Training & Entwicklung', 'Training & Development', 'Formation & Développement', 'Formazione & Sviluppo'),
      T('Payroll & Administrim HR', 'Lohnbuchhaltung & HR-Verwaltung', 'Payroll & HR Administration', 'Paie & Administration RH', 'Paghe & Amministrazione HR'),
    ],
  },
  // ── 20. Transport & Turizëm ──
  {
    slug: 'transport-tourism', icon: '✈️',
    labels: { sq: 'Transport & Turizëm', de: 'Transport & Tourismus', en: 'Transport & Tourism', fr: 'Transport & Tourisme', it: 'Trasporto & Turismo' },
    titles: [
      T('Taksixhi', 'Taxifahrer/in', 'Taxi Driver', 'Chauffeur de taxi', 'Tassista'),
      T('Shofer transporti publik', 'Busfahrer/in', 'Public Transport Driver', 'Chauffeur transport public', 'Autista trasporto pubblico'),
      T('Pilot Avioni / Helikopteri', 'Pilot/in (Flugzeug/Helikopter)', 'Airplane/Helicopter Pilot', 'Pilote d\'avion/hélicoptère', 'Pilota aereo/elicottero'),
      T('Kapiten Anije', 'Schiffskapitän/in', 'Ship Captain', 'Capitaine de navire', 'Capitano di nave'),
      T('Inxhinier Transporti Turistik', 'Tourismustransportingenieur/in', 'Tourism Transport Engineer', 'Ingénieur transport touristique', 'Ingegnere trasporto turistico'),
      T('Instruktor Sportiv / Aktivitet Turistik', 'Sport-/Tourismusaktivitäteninstruktor/in', 'Sports/Tourism Activity Instructor', 'Instructeur sportif & activités touristiques', 'Istruttore sportivo/attività turistiche'),
      T('Operator Agjencie Udhëtimi', 'Reisebüromitarbeiter/in', 'Travel Agency Operator', 'Agent de voyage', 'Operatore agenzia di viaggio'),
    ],
  },
];

// ─── Helper Functions ───────────────────────────────────

/** Get translated title label for a given key + locale */
export function getTranslatedTitle(key: string, locale: Locale): string {
  for (const cat of JOB_CATEGORIES) {
    const title = cat.titles.find((t) => t.key === key);
    if (title) return title.labels[locale] || title.labels.sq;
  }
  return key;
}

/** Get translated category label */
export function getTranslatedCategoryLabel(slug: string, locale: Locale): string {
  const cat = JOB_CATEGORIES.find((c) => c.slug === slug);
  return cat?.labels[locale] || cat?.labels.sq || slug;
}

/** Flat array of all job title keys */
export function getAllJobTitles(): string[] {
  return JOB_CATEGORIES.flatMap((cat) => cat.titles.map((t) => t.key));
}

/** Find which category a job title belongs to */
export function getCategoryForTitle(key: string): JobCategory | undefined {
  return JOB_CATEGORIES.find((cat) => cat.titles.some((t) => t.key === key));
}

/** Get category label for a given job title key */
export function getCategoryLabelForTitle(key: string, locale: Locale = 'sq'): string {
  const cat = getCategoryForTitle(key);
  return cat?.labels[locale] || cat?.labels.sq || '';
}

/** Get all category labels in a given locale */
export function getCategoryLabels(locale: Locale = 'sq'): string[] {
  return JOB_CATEGORIES.map((cat) => cat.labels[locale] || cat.labels.sq);
}

/** Get all titles for a specific category slug */
export function getTitlesBySlug(slug: string): string[] {
  return JOB_CATEGORIES.find((cat) => cat.slug === slug)?.titles.map((t) => t.key) ?? [];
}
