// ============================================================
// Universal MatchDay Shovel — Core Type Definitions
// ============================================================

export type CityId = 'la' | 'cdmx' | 'toronto' | 'ny';

export type MatchPhase =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarterfinal'
  | 'semifinal'
  | 'third_place'
  | 'final';

export type Currency = 'USD' | 'MXN' | 'CAD';

// ─── TEAMS & MATCHES ────────────────────────────────────────

export interface Team {
  code: string;   // FIFA 3-letter code e.g. 'USA'
  name: string;
  flag: string;   // emoji flag
}

export interface Stadium {
  id: string;
  name: string;
  city: CityId;
  address: string;
  lat: number;
  lng: number;
  capacity: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffISO: string;   // UTC ISO 8601
  stadium: Stadium;
  phase: MatchPhase;
  phaseLabel: string;   // e.g. "Group A", "Quarterfinal"
  tvChannel?: string;
}

// ─── PUBS & VENUES ──────────────────────────────────────────

export type PubFeature =
  | 'outdoor_patio'
  | 'multiple_screens'
  | 'private_booths'
  | 'standing_room'
  | 'vip_section'
  | 'full_kitchen'
  | 'craft_beer'
  | 'cocktail_bar'
  | 'watch_party_host'
  | 'fan_zone'
  | 'food_packages'
  | 'bottle_service';

export interface Pub {
  id: string;
  name: string;
  tagline: string;
  address: string;
  neighborhood: string;
  city: CityId;
  lat: number;
  lng: number;
  distanceKm?: number;          // populated at runtime
  features: PubFeature[];
  orderAheadAvailable: boolean;
  capacity: number;
  rating: number;               // 1.0–5.0
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;   // $ to $$$$
  phone: string;
  website?: string;
  depositRequired: boolean;
  depositAmount?: number;
  currency: Currency;
  imageGradient: string;        // Tailwind gradient class pair for card bg
}

// ─── MENU & CART ────────────────────────────────────────────

export type MenuCategory =
  | 'beer'
  | 'cocktail'
  | 'wine'
  | 'non_alcoholic'
  | 'shot'
  | 'snack'
  | 'main'
  | 'side'
  | 'package';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: Currency;
  category: MenuCategory;
  popular?: boolean;
  emoji: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// ─── LEADS ──────────────────────────────────────────────────

export type LeadStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  cityId: CityId;
  pubId: string;
  matchId: string;
  partySize: number;
  cart: CartItem[];
  specialRequests: string;
  createdAt: string;      // ISO 8601
  totalAmount: number;
  currency: Currency;
  status: LeadStatus;
}

// ─── ENGINE STATE ────────────────────────────────────────────

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isLive: boolean;
  isPreKickoff: boolean;    // within 2 hours of kickoff
  isCompleted: boolean;
  matchMinute?: number;
  period?: 'first_half' | 'halftime' | 'second_half' | 'extra_time' | 'penalties';
}

export interface GeoState {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
  lat?: number;
  lng?: number;
  closestCityId?: CityId;
  error?: string;
}

export interface CityData {
  id: CityId;
  name: string;
  displayName: string;
  shortName: string;    // tab label e.g. 'LA', 'CDMX'
  lat: number;
  lng: number;
  timezone: string;
  country: string;
  countryCode: string;
  emoji: string;        // country flag emoji
  matches: Match[];
  pubs: Pub[];
  stadiums: Stadium[];
}

// ─── UI STATE ────────────────────────────────────────────────

export type ModalView = 'closed' | 'order_ahead';

export interface ModalState {
  view: ModalView;
  selectedPub: Pub | null;
  selectedMatch: Match | null;
}

export interface MatchdayEngineReturn {
  cities: CityData[];
  selectedCityId: CityId;
  selectedCity: CityData;
  upcomingMatches: Match[];
  nextMatch: Match | null;
  countdown: CountdownState | null;
  geo: GeoState;
  leads: Lead[];
  selectCity: (id: CityId) => void;
  requestGeo: () => void;
  saveLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'status'>) => Lead;
}
