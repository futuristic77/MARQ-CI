/**
 * MARQ’CI catalogue — the single source of truth for brands, collections,
 * products, categories and editorial looks. Every page reads from here.
 *
 * DEMONSTRATION DATA: brands, stock, descriptions and prices are fictional
 * sample content, not real commercial data.
 */
// Campagne photos live in the site's cloud media library (private "media" bucket),
// served publicly through /api/public/media — no photo files in the code repository.
const campaignPostcard = "/api/public/media/other/30cb0ccf-ff2c-495e-9aee-6a97cf0b419f.jpg";
const campaignLowSignal = "/api/public/media/other/fc58e62e-5608-416a-80a1-eefc76a77ba4.jpg";
const campaignQuietHours = "/api/public/media/other/4d0a3d7f-8a90-4905-b57b-7fa7fdbb3000.jpg";
const campaignAnalogFoot = "/api/public/media/other/554b6935-5ee8-4436-baf4-c2d1ca860151.jpg";

export const IS_DEMO_CATALOGUE = true;

// ---------- images ----------
export const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/";
export const px = (file: string, w: number) =>
  `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(CDN + file)}&w=${w}&q=85`;

export const CUTS = [
  "hf_20261108_190717_6580d844-f3b0-4240-8b4a-239355685fc9.png",
  "hf_20261111_034030_a9171bb1-0b34-4468-9a9e-f451d79b8429.png",
  "hf_20261111_034045_5a78f1ff-8dea-4054-85bc-60a28a4cc434.png",
  "hf_20261111_034059_24eecc7c-e8b7-4b9c-b58c-b862b1261e87.png",
  "hf_20261111_034112_5aa3a76f-7e92-48bb-b93d-ec3a35be2494.png",
  "hf_20261111_034123_ce28dc23-bd91-40ba-95e6-7a09442a865f.png",
  "hf_20261111_034137_abed307a-bcb4-4192-82e9-6ec122a80820.png",
  "hf_20261111_034150_fc1776ff-a8d6-4060-a8af-1afedfdfc563.png",
  "hf_20261111_034202_62b7ffb7-14f5-4dfc-87fe-83c6d9ee6134.png",
];

export const SHEETS = [
  "hf_20261108_190756_3f427fdd-ba34-433e-bc55-eb9b03d2e1c6.png",
  "hf_20261108_190758_785127d3-ef7d-4831-976b-14540a7188aa.png",
  "hf_20261108_190800_4db1daba-ebb1-436f-857a-91dfab40f4b7.png",
];

// ---------- helpers ----------
export const pad = (n: number) => String(n).padStart(2, "0");
/** Franc CFA, French formatting: "85\u202f200\u00a0FCFA" (no decimals). */
export const money = (v: number) => {
  const n = Math.round(v);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  return `${n < 0 ? "-" : ""}${digits}\u00a0FCFA`;
};
export const MINUS = "\u2212";

const NUMBER_WORDS = ["Zéro", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"];
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

// ---------- sizes ----------
export const CLOTH = ["S", "M", "L", "XL"];
export const SHOE = ["40", "41", "42", "43", "44", "45"];
export const ONE = ["Taille unique"];
export const ALL_SIZES = [...CLOTH, ...SHOE, ...ONE];

/** Default size: second size when there is more than one (M / 41), else the only size. */
export const defaultSize = (sizes: string[]): string => (sizes.length > 1 ? sizes[1] : sizes[0]) ?? "";

// ---------- types ----------
export type Kind = "Top" | "Outerwear" | "Bottom" | "Shoes" | "Accessory";

export const KIND_LABEL: Record<Kind, string> = {
  Top: "Haut",
  Outerwear: "Veste",
  Bottom: "Bas",
  Shoes: "Chaussures",
  Accessory: "Accessoire",
};
export const kindLabel = (k: Kind) => KIND_LABEL[k];

export interface Category {
  slug: string;
  name: string;
  kind: Kind;
  blurb: string;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  city: string;
  founded: number;
  tagline: string;
  description: string;
  campaign: { title: string; copy: string; image: string };
  /** Set on brands managed from /admin */
  logo?: string | undefined;
  editorial?: string | undefined;
  extraInfo?: string | undefined;
  /** true for the built-in demonstration content */
  demo?: boolean;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  drop: string;
  isNew: boolean;
  description: string;
  cover?: string | undefined;
  gallery?: string[] | undefined;
  demo?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  kind: Kind;
  categorySlug: string;
  brandId: string;
  collectionId: string;
  price: number;
  sizes: string[];
  /** units in stock per size */
  stock: Record<string, number>;
  isNew: boolean;
  /** ISO date of arrival (for "new arrivals" sorting) */
  arrived: string;
  colour: string;
  material: string;
  description: string;
  /** look number (1..9) and item index (0..2) — used to crop product imagery */
  lookN: number;
  item: number;
  /** Uploaded photos (admin-managed garments); demo garments use contact-sheet crops instead */
  image?: string | undefined;
  images?: string[] | undefined;
  reference?: string | undefined;
  demo?: boolean;
}

export interface Look {
  n: number;
  slug: string;
  name: string;
  foot: number;
  tags: [number, number][];
  productIds: string[];
  note: string;
  /** Uploaded full-body model photo (admin-managed looks) */
  image?: string | undefined;
  /** Database id (admin-managed looks) */
  dbId?: string | undefined;
  /** Demo cut-out file on the CDN */
  cut?: string | undefined;
  demo?: boolean;
}

// ---------- categories ----------
export const CATEGORIES: Category[] = [
  { slug: "tops", name: "Hauts", kind: "Top", blurb: "Débardeurs, mailles, chemises et sweats." },
  { slug: "outerwear", name: "Vestes & manteaux", kind: "Outerwear", blurb: "Coupe-vent, vestes et blazers." },
  { slug: "bottoms", name: "Bas", kind: "Bottom", blurb: "Pantalons, jeans et shorts." },
  { slug: "shoes", name: "Chaussures", kind: "Shoes", blurb: "Mocassins, baskets, bottines et claquettes." },
  { slug: "accessories", name: "Accessoires", kind: "Accessory", blurb: "Ceintures et petite maroquinerie." },
];
const categoryFor = (k: Kind) => CATEGORIES.find((c) => c.kind === k)!.slug;

// ---------- brands ----------
export const BRANDS: Brand[] = [
  {
    id: "postcard-club",
    slug: "postcard-club",
    name: "Postcard Club",
    city: "Lisbonne",
    founded: 2019,
    tagline: "Des vêtements pour les jours où l’on aimerait être ailleurs.",
    description:
      "Postcard Club confectionne des chemises légères, des débardeurs et des shorts à pinces pour les longues après-midi sans programme. Cotons lavés, lin et rayures, coupés assez amples pour rester toute la journée sur une chaise pliante.",
    campaign: {
      title: "Wish You Were Here",
      copy: "Photographiée sur une seule chaise pliante. Une carte postale, sans adresse, sans intention de l’envoyer.",
      image: campaignPostcard,
    },
  },
  {
    id: "low-signal-works",
    slug: "low-signal-works",
    name: "Low Signal Works",
    city: "Oslo",
    founded: 2017,
    tagline: "Des vestes pour les endroits sans réseau.",
    description:
      "Low Signal Works fabrique polaires, coupe-vent et pantalons de travail pour les marches où le téléphone reste au fond de la poche. Détails utilitaires, tissus francs et une carte papier dans chaque poche.",
    campaign: {
      title: "Off-Grid",
      copy: "Un coupe-vent jaune, une carte papier et un téléphone qui ne sert qu’à appeler.",
      image: campaignLowSignal,
    },
  },
  {
    id: "quiet-hours",
    slug: "quiet-hours",
    name: "Quiet Hours",
    city: "Anvers",
    founded: 2015,
    tagline: "Une coupe soignée pour les heures que l’on garde pour soi.",
    description:
      "Quiet Hours taille le velours, la laine et le denim en vestiaire souple. Cols roulés, blazers et pantalons pensés pour les salles de lecture, les trains tardifs et les soirées sans notifications.",
    campaign: {
      title: "Do Not Disturb",
      copy: "Du velours, un col roulé et un livre de poche. Les accusés de lecture sont désactivés.",
      image: campaignQuietHours,
    },
  },
  {
    id: "analog-foot",
    slug: "analog-foot",
    name: "Analog Foot",
    city: "Porto",
    founded: 2012,
    tagline: "Des chaussures faites pour prendre le chemin le plus long.",
    description:
      "Analog Foot fabrique des chaussures en daim, en cuir et en mesh dans un petit atelier. Mocassins, desert boots, baskets de court et claquettes, ainsi que des ceintures tressées réalisées avec les chutes de cuir.",
    campaign: {
      title: "Field Notes",
      copy: "Des desert boots en pleine foulée, des mocassins qui attendent près de la porte.",
      image: campaignAnalogFoot,
    },
  },
];

// ---------- collections ----------
export const COLLECTIONS: Collection[] = [
  {
    id: "wish-you-were-here",
    slug: "wish-you-were-here",
    name: "Wish You Were Here",
    brandId: "postcard-club",
    drop: "Drop 01 · sept. 2026",
    isNew: false,
    description: "Débardeurs côtelés, chemises rayées ouvertes et shorts à pinces. L’uniforme d’été pour aller nulle part en particulier.",
  },
  {
    id: "late-summer",
    slug: "late-summer",
    name: "Late Summer",
    brandId: "postcard-club",
    drop: "Drop 02 · nov. 2026",
    isNew: true,
    description: "Chemises en lin à col cubain et bermudas à pinces pour les semaines où tout le monde est déjà rentré.",
  },
  {
    id: "off-grid",
    slug: "off-grid",
    name: "Off-Grid",
    brandId: "low-signal-works",
    drop: "Drop 01 · sept. 2026",
    isNew: false,
    description: "Polaire, anorak jaune et short de randonnée en nylon. Pensés pour les marches sans réseau.",
  },
  {
    id: "night-shift",
    slug: "night-shift",
    name: "Night Shift",
    brandId: "low-signal-works",
    drop: "Drop 02 · nov. 2026",
    isNew: true,
    description: "Un sweat à capuche noir délavé et un pantalon charpentier pour travailler tard et se déconnecter tôt.",
  },
  {
    id: "do-not-disturb",
    slug: "do-not-disturb",
    name: "Do Not Disturb",
    brandId: "quiet-hours",
    drop: "Drop 01 · sept. 2026",
    isNew: false,
    description: "Cols roulés marine, pantalons en laine, blazer en velours et jean noir slim. Un vestiaire souple pour rester chez soi.",
  },
  {
    id: "weekend-study",
    slug: "weekend-study",
    name: "Weekend Study",
    brandId: "quiet-hours",
    drop: "Drop 01 · sept. 2026",
    isNew: false,
    description: "Vestes en velours, maillots de rugby et chinos fuselés pour les samedis à la bibliothèque.",
  },
  {
    id: "field-notes",
    slug: "field-notes",
    name: "Field Notes",
    brandId: "analog-foot",
    drop: "Drop 01 · sept. 2026",
    isNew: false,
    description: "Mocassins en daim, desert boots, baskets basses et ceinture tressée. Faits pour prendre le chemin le plus long.",
  },
  {
    id: "court-and-sand",
    slug: "court-and-sand",
    name: "Court & Sand",
    brandId: "analog-foot",
    drop: "Drop 02 · nov. 2026",
    isNew: true,
    description: "Baskets en mesh, sandales épaisses, babies, baskets de court et claquettes en cuir.",
  },
];

// ---------- products ----------
type Row = [
  slug: string,
  name: string,
  kind: Kind,
  price: number,
  sizes: string[],
  brandId: string,
  collectionId: string,
  colour: string,
  material: string,
  description: string,
];

/** Items in look order: look n, item 0..2 */
const ROWS: Row[][] = [
  [
    ["ribbed-tank-top", "Débardeur côtelé", "Top", 21500, CLOTH, "postcard-club", "wish-you-were-here", "Blanc", "100 % coton côtelé", "Un débardeur ajusté en coton côtelé blanc éclatant. À porter seul ou sous une chemise ouverte."],
    ["striped-open-shirt", "Chemise rayée ouverte", "Top", 44500, CLOTH, "postcard-club", "wish-you-were-here", "Rayé bleu / blanc", "Popeline de coton", "Une chemise ample en popeline à rayures bleues, à porter ouverte, manches retroussées."],
    ["braided-belt", "Ceinture tressée", "Accessory", 19000, ONE, "analog-foot", "field-notes", "Fauve", "Cuir tressé tanné végétal", "Cuir tressé et boucle en laiton, réalisée avec les chutes de l’atelier Analog Foot."],
  ],
  [
    ["corduroy-trucker", "Veste en velours", "Outerwear", 85000, CLOTH, "quiet-hours", "weekend-study", "Tabac", "Velours de coton, 8 côtes", "Une veste carrée en velours tabac avec poches poitrine et boutons ton sur ton."],
    ["pleated-shorts", "Short à pinces", "Bottom", 38500, CLOTH, "postcard-club", "wish-you-were-here", "Olive", "Sergé de coton", "Un short en sergé à double pince, taille haute et jambe décontractée au-dessus du genou."],
    ["suede-moccasin", "Mocassin en daim", "Shoes", 71000, SHOE, "analog-foot", "field-notes", "Daim marron", "Daim, semelle à picots", "Mocassins de conduite en daim marron souple, plateau lacé main et semelle à picots."],
  ],
  [
    ["polar-fleece-zip", "Polaire zippée", "Top", 55000, CLOTH, "low-signal-works", "off-grid", "Lilas", "Polaire recyclée", "Une polaire entièrement zippée couleur lilas, col montant et poignets élastiqués."],
    ["nylon-hike-shorts", "Short de randonnée en nylon", "Bottom", 35000, CLOTH, "low-signal-works", "off-grid", "Noir", "Nylon à séchage rapide", "Un short léger en nylon à taille coulissée qui sèche avant d’arriver à la voiture."],
    ["mesh-trainers", "Baskets en mesh", "Shoes", 74500, SHOE, "analog-foot", "court-and-sand", "Argent / gris", "Mesh, empiècements synthétiques", "Des baskets inspirées de la course, en mesh argenté avec semelle amortissante."],
  ],
  [
    ["yellow-anorak-shell", "Anorak jaune", "Outerwear", 77000, CLOTH, "low-signal-works", "off-grid", "Jaune", "Nylon déperlant", "Un anorak à enfiler jaune signal, poche kangourou et capuche repliable."],
    ["fleece-joggers", "Jogging molletonné", "Bottom", 43000, CLOTH, "low-signal-works", "off-grid", "Gris chiné", "Molleton de coton gratté", "Un jogging en molleton gratté, chevilles resserrées et poches latérales profondes."],
    ["chunky-sandals", "Sandales épaisses", "Shoes", 50500, SHOE, "analog-foot", "court-and-sand", "Noir", "Sangles, semelle EVA", "Sandales à trois brides sur une semelle épaisse et légère. Réglables à chaque bride."],
  ],
  [
    ["navy-rollneck-knit", "Col roulé marine", "Top", 71000, CLOTH, "quiet-hours", "do-not-disturb", "Marine", "Laine d’agneau", "Un col roulé doux en laine d’agneau bleu marine profond, col replié."],
    ["wool-trousers", "Pantalon en laine", "Bottom", 63500, CLOTH, "quiet-hours", "do-not-disturb", "Gris moyen", "Flanelle de laine", "Un pantalon droit en flanelle, à pince simple et revers."],
    ["leather-mary-janes", "Babies en cuir", "Shoes", 80500, SHOE, "analog-foot", "court-and-sand", "Cuir noir", "Cuir de veau, semelle cuir", "Des babies en cuir noir poli, bride à boucle et fine semelle en cuir."],
  ],
  [
    ["corduroy-blazer", "Blazer en velours", "Outerwear", 93500, CLOTH, "quiet-hours", "do-not-disturb", "Chocolat", "Velours de coton", "Un blazer droit en velours chocolat avec poches plaquées."],
    ["black-slim-jeans", "Jean noir slim", "Bottom", 59000, CLOTH, "quiet-hours", "do-not-disturb", "Noir délavé", "Denim de coton brut", "Un jean noir slim en denim brut qui se patine lentement au fil du temps."],
    ["desert-boots", "Desert boots", "Shoes", 87500, SHOE, "analog-foot", "field-notes", "Daim sable", "Daim, semelle crêpe", "Desert boots à deux œillets en daim sable sur une semelle crêpe souple."],
  ],
  [
    ["faded-black-hoodie", "Sweat à capuche noir délavé", "Top", 51500, CLOTH, "low-signal-works", "night-shift", "Noir délavé", "Coton bouclette teint en pièce", "Un sweat à capuche épais teint en pièce, délavé jusqu’à un noir doux."],
    ["carpenter-trousers", "Pantalon charpentier", "Bottom", 56500, CLOTH, "low-signal-works", "night-shift", "Pierre", "Toile de coton", "Un pantalon charpentier large en toile, avec passant marteau et poches à outils."],
    ["retro-court-sneaker", "Basket de court rétro", "Shoes", 69500, SHOE, "analog-foot", "court-and-sand", "Blanc / vert", "Cuir, semelle cuvette en caoutchouc", "Une basket basse en cuir avec languette de talon contrastée."],
  ],
  [
    ["linen-camp-shirt", "Chemise en lin à col cubain", "Top", 45500, CLOTH, "postcard-club", "late-summer", "Écru", "100 % lin", "Une chemise à col cubain en lin écru lavé, bas droit."],
    ["pleated-bermuda", "Bermuda à pinces", "Bottom", 41000, CLOTH, "postcard-club", "late-summer", "Kaki", "Sergé coton-lin", "Un bermuda long à pinces en sergé kaki qui tombe juste sous le genou."],
    ["leather-slides", "Claquettes en cuir", "Shoes", 37000, SHOE, "analog-foot", "court-and-sand", "Marron foncé", "Cuir, semelle en liège", "Des claquettes simples en cuir sur une semelle en liège moulée."],
  ],
  [
    ["rugby-top", "Maillot de rugby", "Top", 53000, CLOTH, "quiet-hours", "weekend-study", "Rayé marine / rouge", "Jersey de coton épais", "Un maillot de rugby rayé en jersey épais avec col en sergé blanc."],
    ["tapered-khakis", "Chino fuselé", "Bottom", 50500, CLOTH, "quiet-hours", "weekend-study", "Kaki", "Chino de coton", "Ample à la cuisse et fuselé à la cheville, dans un chino kaki classique."],
    ["suede-low-tops", "Baskets basses en daim", "Shoes", 73000, SHOE, "analog-foot", "field-notes", "Daim taupe", "Daim, semelle gomme", "Des baskets basses en daim sur semelle gomme, assouplies à la main avant de quitter l’atelier."],
  ],
];

/** Deterministic demo stock (Park–Miller LCG) — default sizes always have stock. */
function demoStock(seedBase: number, sizes: string[]): Record<string, number> {
  let seed = 11 + seedBase * 97;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const def = defaultSize(sizes);
  const out: Record<string, number> = {};
  for (const s of sizes) {
    let n = Math.max(0, Math.floor(rnd() * 9) - 2);
    if (s === def) n = Math.max(n, sizes.length === 1 ? 6 : 2);
    out[s] = n;
  }
  return out;
}

export const PRODUCTS: Product[] = ROWS.flatMap((rows, li) =>
  rows.map((r, item): Product => {
    const [slug, name, kind, price, sizes, brandId, collectionId, colour, material, description] = r;
    const col = COLLECTIONS.find((c) => c.id === collectionId)!;
    return {
      id: slug,
      slug,
      name,
      kind,
      categorySlug: categoryFor(kind),
      brandId,
      collectionId,
      price,
      sizes,
      stock: demoStock(li * 3 + item + 1, sizes),
      isNew: col.isNew,
      arrived: col.isNew ? `2026-11-${pad(2 + li)}` : `2026-09-${pad(1 + li)}`,
      colour,
      material,
      description,
      lookN: li + 1,
      item,
    };
  }),
);

// ---------- looks ----------
export const LOOKS: Look[] = [
  { n: 1, slug: "somewhere-else", name: "Ailleurs", foot: 0.0501, tags: [[52, 44], [80, 40], [44, 57]], note: "Un débardeur blanc, une rayure ouverte et nulle part où aller." },
  { n: 2, slug: "dial-up", name: "Connexion lente", foot: 0.0501, tags: [[76, 45], [54, 68], [45, 87]], note: "Velours et daim, qui se connectent lentement." },
  { n: 3, slug: "long-walks", name: "Longues marches", foot: 0.0656, tags: [[66, 47], [51, 64], [48, 87]], note: "Polaire lilas et baskets pour le chemin le plus long." },
  { n: 4, slug: "low-battery", name: "Batterie faible", foot: 0.0582, tags: [[76, 47], [43, 70], [54, 88]], note: "Jaune signal pour quand le téléphone abandonne le premier." },
  { n: 5, slug: "no-reply", name: "Sans réponse", foot: 0.065, tags: [[72, 41], [51, 68], [45, 89]], note: "Marine, flanelle et cuir. Vu, sans réponse." },
  { n: 6, slug: "analog", name: "Analogique", foot: 0.047, tags: [[75, 45], [51, 70], [46, 88]], note: "Blazer en velours, denim noir, desert boots." },
  { n: 7, slug: "rewind", name: "Retour arrière", foot: 0.0377, tags: [[69, 43], [51, 72], [56, 92]], note: "Un sweat délavé et un pantalon charpentier en boucle." },
  { n: 8, slug: "out-of-office", name: "Absent du bureau", foot: 0.0891, tags: [[65, 47], [43, 68], [60, 86]], note: "Du lin et un bermuda. De retour un jour, peut-être." },
  { n: 9, slug: "paper-maps", name: "Cartes papier", foot: 0.0588, tags: [[66, 41], [48, 72], [56, 88]], note: "Un maillot de rugby et un chino pour se perdre exprès." },
].map((l) => ({
  ...l,
  tags: l.tags as [number, number][],
  productIds: ROWS[l.n - 1]!.map((r) => r[0]),
  cut: CUTS[l.n - 1]!,
  demo: true,
}));

for (const b of BRANDS) b.demo = true;
for (const c of COLLECTIONS) c.demo = true;
for (const p of PRODUCTS) p.demo = true;

/** Frozen copy of the built-in demonstration content; published admin content is merged in front of it. */
export const DEMO = {
  brands: [...BRANDS],
  collections: [...COLLECTIONS],
  products: [...PRODUCTS],
  looks: [...LOOKS],
};

// ---------- lookups ----------
const bySlug = <T extends { slug: string }>(list: T[], slug: string) => list.find((x) => x.slug === slug);

export const getBrand = (slug: string) => bySlug(BRANDS, slug);
export const getCollection = (slug: string) => bySlug(COLLECTIONS, slug);
export const getProduct = (slug: string) => bySlug(PRODUCTS, slug);
export const getLook = (slug: string) => bySlug(LOOKS, slug);
export const getCategory = (slug: string) => bySlug(CATEGORIES, slug);

export const brandOf = (p: { brandId: string }) => BRANDS.find((b) => b.id === p.brandId)!;
export const collectionOf = (p: { collectionId: string }) => COLLECTIONS.find((c) => c.id === p.collectionId)!;
export const categoryOf = (p: Product) => CATEGORIES.find((c) => c.slug === p.categorySlug)!;
export const lookOf = (p: Product): Look | undefined => LOOKS.find((l) => l.productIds.includes(p.id));
export const productsOfLook = (l: Look) =>
  l.productIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));

export const productsOfBrand = (brandId: string) => PRODUCTS.filter((p) => p.brandId === brandId);
export const productsOfCollection = (collectionId: string) => PRODUCTS.filter((p) => p.collectionId === collectionId);
export const collectionsOfBrand = (brandId: string) => COLLECTIONS.filter((c) => c.brandId === brandId);
export const productsOfCategory = (slug: string) => (slug === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.categorySlug === slug));

export const looksOfBrand = (brandId: string) =>
  LOOKS.filter((l) => productsOfLook(l).some((p) => p.brandId === brandId));
export const looksOfCollection = (collectionId: string) =>
  LOOKS.filter((l) => productsOfLook(l).some((p) => p.collectionId === collectionId));
export const looksOfProduct = (p: Product) => LOOKS.filter((l) => l.productIds.includes(p.id));
export const brandsOfLook = (l: Look) => {
  const ids = [...new Set(productsOfLook(l).map((p) => p.brandId))];
  return ids.map((id) => BRANDS.find((b) => b.id === id)!);
};
export const categoriesOfBrand = (brandId: string) => {
  const slugs = new Set(productsOfBrand(brandId).map((p) => p.categorySlug));
  return CATEGORIES.filter((c) => slugs.has(c.slug));
};

export const lookSubtotal = (l: Look) => productsOfLook(l).reduce((s, p) => s + p.price, 0);
export const wholeFitTotal = (l: Look) => lookSubtotal(l) * 0.9;

// ---------- availability ----------
export const totalStock = (p: Product) => Object.values(p.stock).reduce((a, b) => a + b, 0);
export type Availability = "in-stock" | "low" | "sold-out";
export const availabilityOf = (p: Product): Availability => {
  const t = totalStock(p);
  if (t === 0) return "sold-out";
  if (t < 10) return "low";
  return "in-stock";
};
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  "in-stock": "En stock",
  low: "Stock limité",
  "sold-out": "Épuisé",
};
export const sizeAvailable = (p: Product, size: string) => (p.stock[size] ?? 0) > 0;

// ---------- product imagery ----------
/** Product shot crop on the 3×3 contact sheet: sheet = floor((n−1)/3), row = (n−1)%3, col = item. */
export const productCrop = (p: { lookN: number; item: number }) => ({
  sheet: SHEETS[Math.floor((p.lookN - 1) / 3)]!,
  row: (p.lookN - 1) % 3,
  col: p.item,
});
export const cutFile = (n: number): string => CUTS[n - 1]!;
/** Model image of a look: the uploaded photo, or the demo cut-out at width w. */
export const cutoutOf = (l: Look, w = 914) => l.image ?? px(l.cut ?? cutFile(l.n), w);
/** Responsive srcset for demo cut-outs (uploaded photos are served as-is). */
export const cutoutSrcSet = (l: Look) => (l.image ? undefined : `${cutoutOf(l, 571)} 571w, ${cutoutOf(l, 914)} 914w`);
/** Main photo of an uploaded garment (undefined for demo garments, which use sheet crops). */
export const productImage = (p: Pick<Product, "image" | "images">) => p.image ?? p.images?.[0];
