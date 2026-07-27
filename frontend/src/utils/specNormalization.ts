const FUEL_MAP: Record<string, string> = {
  gas: "Gasolina",
  gasoline: "Gasolina",
  petrol: "Gasolina",
  diesel: "Diésel",
  electric: "Eléctrico",
  hybrid: "Híbrido",
  "plug-in hybrid": "Híbrido enchufable",
  "plug-in": "Híbrido enchufable",
  ethanol: "Etanol",
  e85: "Etanol E85",
  cng: "Gas natural (CNG)",
  lpg: "Gas licuado (LPG)",
  hydrogen: "Hidrógeno",
};

const TRANSMISSION_MAP: Record<string, string> = {
  automatic: "Automática",
  manual: "Manual",
  other: "Otra",
  cvt: "CVT",
  "dual-clutch": "Doble embrague",
  "dct": "Doble embrague",
  amt: "Automatizada",
  tiptronic: "Tiptronic",
};

const DRIVE_MAP: Record<string, string> = {
  fwd: "Delantera",
  rwd: "Trasera",
  awd: "Integral",
  "4wd": "4x4",
  "4x4": "4x4",
  ffd: "Delantera",
};

const BODY_MAP: Record<string, string> = {
  sedan: "Sedán",
  suv: "SUV",
  hatchback: "Hatchback",
  coupe: "Coupé",
  convertible: "Convertible",
  pickup: "Camioneta pickup",
  wagon: "Familiar",
  van: "Furgoneta",
  minivan: "Minivan",
  truck: "Camión",
  "sport utility": "SUV",
  "sport utility vehicle": "SUV",
  "passenger car": "Automóvil",
  "2dr": "Coupé",
  "4dr": "Sedán",
  "crew cab": "Camioneta cabina doble",
  "extended cab": "Camioneta cabina extendida",
};

const CONDITION_MAP: Record<string, string> = {
  new: "Nuevo",
  used: "Usado",
  excellent: "Excelente",
  good: "Bueno",
  fair: "Regular",
  poor: "Deficiente",
  certified: "Certificado",
};

const COLOR_MAP: Record<string, string> = {
  black: "Negro",
  white: "Blanco",
  silver: "Plata",
  gray: "Gris",
  grey: "Gris",
  red: "Rojo",
  blue: "Azul",
  green: "Verde",
  yellow: "Amarillo",
  orange: "Naranja",
  brown: "Marrón",
  beige: "Beige",
  gold: "Dorado",
  purple: "Morado",
  navy: "Azul marino",
  charcoal: "Carbón",
  crimson: "Carmesí",
  teal: "Verde azulado",
  burgundy: "Burdeos",
  pink: "Rosa",
};

export type SpecCategory =
  | "fuel"
  | "transmission"
  | "drive"
  | "body"
  | "condition"
  | "color";

const MAPS: Record<SpecCategory, Record<string, string>> = {
  fuel: FUEL_MAP,
  transmission: TRANSMISSION_MAP,
  drive: DRIVE_MAP,
  body: BODY_MAP,
  condition: CONDITION_MAP,
  color: COLOR_MAP,
};

export function translateSpec(
  value: string | null | undefined,
  category: SpecCategory,
): string {
  if (!value) return "No disponible";
  const normalized = value.trim().toLowerCase();
  const map = MAPS[category];
  const translated = map[normalized];
  if (translated) return translated;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPriceUSD(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "No disponible";
  return `USD ${value.toLocaleString("es-US", { maximumFractionDigits: 0 })}`;
}

export function formatMileage(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "No disponible";
  return `${Math.round(value).toLocaleString("es-US")} km`;
}

export function formatYear(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "No disponible";
  return String(Math.round(value));
}

export function formatPower(value: string | null | undefined): string {
  if (!value) return "No disponible";
  return value;
}

export function formatCapacity(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "No disponible";
  return `${Math.round(value)} personas`;
}

export function safeDisplay(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "No disponible";
  if (typeof value === "number" && isNaN(value)) return "No disponible";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (
      trimmed === "" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "NaN" ||
      trimmed === "N/A" ||
      trimmed === "NA"
    ) {
      return "No disponible";
    }
    return trimmed;
  }
  return String(value);
}
