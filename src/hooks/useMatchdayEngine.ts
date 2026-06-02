// ============================================================
// Universal MatchDay Shovel — The Engine
// 4-City World Cup 2026 Data Matrix + Geo + Countdown + Leads
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CityId, CityData, Match, Pub, Stadium, Team, MenuItem,
  CountdownState, GeoState, Lead, CartItem, FreeActivity,
  MatchdayEngineReturn,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeCountdown(kickoffISO: string): CountdownState {
  const now = Date.now();
  const kickoff = new Date(kickoffISO).getTime();
  const diffMs = kickoff - now;
  const MATCH_WINDOW_MS = 115 * 60 * 1000; // 115-min live window

  if (diffMs > 0) {
    const totalSeconds = Math.floor(diffMs / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalSeconds,
      isLive: false,
      isPreKickoff: diffMs < 2 * 3600 * 1000,
      isCompleted: false,
    };
  }

  if (Math.abs(diffMs) < MATCH_WINDOW_MS) {
    const elapsed = Math.floor(Math.abs(diffMs) / 60000);
    let period: CountdownState['period'];
    let matchMinute: number;

    if (elapsed <= 45) {
      period = 'first_half';
      matchMinute = elapsed + 1;
    } else if (elapsed <= 60) {
      period = 'halftime';
      matchMinute = 45;
    } else if (elapsed <= 105) {
      period = 'second_half';
      matchMinute = elapsed - 15;
    } else {
      period = 'extra_time';
      matchMinute = elapsed - 15;
    }

    return {
      days: 0, hours: 0, minutes: 0, seconds: 0,
      totalSeconds: 0, isLive: true, isPreKickoff: false, isCompleted: false,
      matchMinute, period,
    };
  }

  return {
    days: 0, hours: 0, minutes: 0, seconds: 0,
    totalSeconds: 0, isLive: false, isPreKickoff: false, isCompleted: true,
  };
}

const LS_CITY_KEY = 'mds_selected_city';
const LS_LEADS_KEY = 'mds_leads';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — STADIUMS
// ─────────────────────────────────────────────────────────────────────────────

const STADIUMS: Record<string, Stadium> = {
  sofi: {
    id: 'sofi',
    name: 'SoFi Stadium',
    city: 'la',
    address: '1001 Stadium Dr, Inglewood, CA 90301',
    lat: 33.9535,
    lng: -118.3392,
    capacity: 70240,
  },
  azteca: {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'cdmx',
    address: 'Calzada de Tlalpan 3465, CDMX 04650',
    lat: 19.3029,
    lng: -99.1505,
    capacity: 87000,
  },
  bmo: {
    id: 'bmo',
    name: 'BMO Field',
    city: 'toronto',
    address: '170 Princes Blvd, Toronto, ON M6K 3C3',
    lat: 43.6333,
    lng: -79.4187,
    capacity: 45000,
  },
  metlife: {
    id: 'metlife',
    name: 'MetLife Stadium',
    city: 'ny',
    address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073',
    lat: 40.8135,
    lng: -74.0745,
    capacity: 82500,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — TEAMS
// ─────────────────────────────────────────────────────────────────────────────

const T: Record<string, Team> = {
  USA: { code: 'USA', name: 'United States', flag: '🇺🇸' },
  MEX: { code: 'MEX', name: 'Mexico', flag: '🇲🇽' },
  CAN: { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  ARG: { code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  BRA: { code: 'BRA', name: 'Brazil', flag: '🇧🇷' },
  ENG: { code: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  FRA: { code: 'FRA', name: 'France', flag: '🇫🇷' },
  ESP: { code: 'ESP', name: 'Spain', flag: '🇪🇸' },
  GER: { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  POR: { code: 'POR', name: 'Portugal', flag: '🇵🇹' },
  MAR: { code: 'MAR', name: 'Morocco', flag: '🇲🇦' },
  JPN: { code: 'JPN', name: 'Japan', flag: '🇯🇵' },
  NED: { code: 'NED', name: 'Netherlands', flag: '🇳🇱' },
  URU: { code: 'URU', name: 'Uruguay', flag: '🇺🇾' },
  COL: { code: 'COL', name: 'Colombia', flag: '🇨🇴' },
  SEN: { code: 'SEN', name: 'Senegal', flag: '🇸🇳' },
  AUS: { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  KOR: { code: 'KOR', name: 'South Korea', flag: '🇰🇷' },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — MATCHES (All times UTC ISO 8601)
// ─────────────────────────────────────────────────────────────────────────────

const MATCHES_LA: Match[] = [
  {
    id: 'la-001', homeTeam: T.USA, awayTeam: T.POR,
    kickoffISO: '2026-06-12T01:00:00Z',   // Jun 11 6PM PT
    stadium: STADIUMS.sofi, phase: 'group',
    phaseLabel: 'Group B', tvChannel: 'FOX',
  },
  {
    id: 'la-002', homeTeam: T.ARG, awayTeam: T.AUS,
    kickoffISO: '2026-06-17T22:00:00Z',   // Jun 17 3PM PT
    stadium: STADIUMS.sofi, phase: 'group',
    phaseLabel: 'Group D', tvChannel: 'FS1',
  },
  {
    id: 'la-003', homeTeam: T.ENG, awayTeam: T.SEN,
    kickoffISO: '2026-06-22T01:00:00Z',   // Jun 21 6PM PT
    stadium: STADIUMS.sofi, phase: 'group',
    phaseLabel: 'Group C', tvChannel: 'FOX',
  },
  {
    id: 'la-004', homeTeam: T.BRA, awayTeam: T.URU,
    kickoffISO: '2026-07-10T01:00:00Z',   // Jul 9 6PM PT
    stadium: STADIUMS.sofi, phase: 'quarterfinal',
    phaseLabel: 'Quarterfinal', tvChannel: 'FOX',
  },
  {
    id: 'la-005', homeTeam: T.USA, awayTeam: T.MEX,
    kickoffISO: '2026-07-15T01:00:00Z',   // Jul 14 6PM PT
    stadium: STADIUMS.sofi, phase: 'semifinal',
    phaseLabel: 'Semifinal', tvChannel: 'FOX',
  },
];

const MATCHES_CDMX: Match[] = [
  {
    id: 'cdmx-001', homeTeam: T.MEX, awayTeam: T.KOR,
    kickoffISO: '2026-06-11T20:00:00Z',   // Jun 11 2PM CDT — Opening Day
    stadium: STADIUMS.azteca, phase: 'group',
    phaseLabel: 'Group A — Opening Match', tvChannel: 'Azteca / Telemundo',
  },
  {
    id: 'cdmx-002', homeTeam: T.ARG, awayTeam: T.COL,
    kickoffISO: '2026-06-16T23:00:00Z',   // Jun 16 6PM CDT
    stadium: STADIUMS.azteca, phase: 'group',
    phaseLabel: 'Group E', tvChannel: 'Telemundo',
  },
  {
    id: 'cdmx-003', homeTeam: T.MAR, awayTeam: T.BRA,
    kickoffISO: '2026-06-21T23:00:00Z',   // Jun 21 6PM CDT
    stadium: STADIUMS.azteca, phase: 'group',
    phaseLabel: 'Group F', tvChannel: 'Azteca',
  },
  {
    id: 'cdmx-004', homeTeam: T.MEX, awayTeam: T.URU,
    kickoffISO: '2026-06-30T01:00:00Z',   // Jun 29 8PM CDT
    stadium: STADIUMS.azteca, phase: 'round_of_32',
    phaseLabel: 'Round of 32', tvChannel: 'Azteca / Telemundo',
  },
];

const MATCHES_TORONTO: Match[] = [
  {
    id: 'tor-001', homeTeam: T.CAN, awayTeam: T.MAR,
    kickoffISO: '2026-06-13T20:00:00Z',   // Jun 13 4PM ET
    stadium: STADIUMS.bmo, phase: 'group',
    phaseLabel: 'Group A', tvChannel: 'TSN / CTV',
  },
  {
    id: 'tor-002', homeTeam: T.FRA, awayTeam: T.JPN,
    kickoffISO: '2026-06-18T23:00:00Z',   // Jun 18 7PM ET
    stadium: STADIUMS.bmo, phase: 'group',
    phaseLabel: 'Group G', tvChannel: 'TSN',
  },
  {
    id: 'tor-003', homeTeam: T.CAN, awayTeam: T.NED,
    kickoffISO: '2026-06-24T22:00:00Z',   // Jun 24 6PM ET
    stadium: STADIUMS.bmo, phase: 'group',
    phaseLabel: 'Group A', tvChannel: 'TSN / CTV',
  },
  {
    id: 'tor-004', homeTeam: T.GER, awayTeam: T.POR,
    kickoffISO: '2026-07-05T22:00:00Z',   // Jul 5 6PM ET
    stadium: STADIUMS.bmo, phase: 'round_of_16',
    phaseLabel: 'Round of 16', tvChannel: 'TSN',
  },
];

const MATCHES_NY: Match[] = [
  {
    id: 'ny-001', homeTeam: T.ENG, awayTeam: T.FRA,
    kickoffISO: '2026-06-14T22:00:00Z',   // Jun 14 6PM ET
    stadium: STADIUMS.metlife, phase: 'group',
    phaseLabel: 'Group C', tvChannel: 'FOX',
  },
  {
    id: 'ny-002', homeTeam: T.BRA, awayTeam: T.GER,
    kickoffISO: '2026-06-19T23:00:00Z',   // Jun 19 7PM ET
    stadium: STADIUMS.metlife, phase: 'group',
    phaseLabel: 'Group H', tvChannel: 'FS1',
  },
  {
    id: 'ny-003', homeTeam: T.USA, awayTeam: T.ESP,
    kickoffISO: '2026-06-25T23:00:00Z',   // Jun 25 7PM ET
    stadium: STADIUMS.metlife, phase: 'group',
    phaseLabel: 'Group B', tvChannel: 'FOX',
  },
  {
    id: 'ny-004', homeTeam: T.ARG, awayTeam: T.ENG,
    kickoffISO: '2026-07-07T22:00:00Z',   // Jul 7 6PM ET
    stadium: STADIUMS.metlife, phase: 'round_of_16',
    phaseLabel: 'Round of 16', tvChannel: 'FOX',
  },
  {
    id: 'ny-005', homeTeam: T.BRA, awayTeam: T.FRA,
    kickoffISO: '2026-07-19T20:00:00Z',   // Jul 19 4PM ET — THE FINAL
    stadium: STADIUMS.metlife, phase: 'final',
    phaseLabel: '🏆 THE WORLD CUP FINAL', tvChannel: 'FOX / Telemundo',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — PUBS
// ─────────────────────────────────────────────────────────────────────────────

const PUBS_LA: Pub[] = [
  {
    id: 'la-pub-001', name: 'The Offside Lounge',
    tagline: "LA's premier football bar since 2018",
    address: '8400 Sunset Blvd, West Hollywood, CA 90069',
    neighborhood: 'West Hollywood', city: 'la',
    lat: 34.0901, lng: -118.3817,
    features: ['multiple_screens', 'outdoor_patio', 'craft_beer', 'watch_party_host', 'food_packages'],
    orderAheadAvailable: true, capacity: 280, rating: 4.8, reviewCount: 1247,
    priceLevel: 2, phone: '+1 (310) 555-0192',
    depositRequired: true, depositAmount: 25, currency: 'USD',
    imageGradient: 'from-emerald-900 to-zinc-900',
  },
  {
    id: 'la-pub-002', name: 'Copa Kings',
    tagline: 'Rooftop views, world-class vibes',
    address: '6801 Hollywood Blvd, Hollywood, CA 90028',
    neighborhood: 'Hollywood', city: 'la',
    lat: 34.1022, lng: -118.3412,
    features: ['outdoor_patio', 'vip_section', 'cocktail_bar', 'bottle_service', 'fan_zone'],
    orderAheadAvailable: true, capacity: 400, rating: 4.6, reviewCount: 892,
    priceLevel: 3, phone: '+1 (323) 555-0147',
    depositRequired: true, depositAmount: 50, currency: 'USD',
    imageGradient: 'from-amber-900 to-zinc-900',
  },
  {
    id: 'la-pub-003', name: "Hooligan's Sports Kitchen",
    tagline: 'Cold beer, loud cheers, great grub',
    address: '3200 Wilshire Blvd, Santa Monica, CA 90403',
    neighborhood: 'Santa Monica', city: 'la',
    lat: 34.0359, lng: -118.4912,
    features: ['full_kitchen', 'multiple_screens', 'standing_room', 'craft_beer', 'food_packages'],
    orderAheadAvailable: true, capacity: 180, rating: 4.7, reviewCount: 2103,
    priceLevel: 2, phone: '+1 (310) 555-0083',
    depositRequired: false, currency: 'USD',
    imageGradient: 'from-sky-900 to-zinc-900',
  },
  {
    id: 'la-pub-004', name: 'Pitch & Pint',
    tagline: 'Craft beer garden for the beautiful game',
    address: '1510 E Colorado Blvd, Pasadena, CA 91106',
    neighborhood: 'Pasadena', city: 'la',
    lat: 34.1478, lng: -118.1165,
    features: ['outdoor_patio', 'craft_beer', 'watch_party_host', 'private_booths'],
    orderAheadAvailable: true, capacity: 150, rating: 4.5, reviewCount: 634,
    priceLevel: 2, phone: '+1 (626) 555-0219',
    depositRequired: false, currency: 'USD',
    imageGradient: 'from-violet-900 to-zinc-900',
  },
];

const PUBS_CDMX: Pub[] = [
  {
    id: 'cdmx-pub-001', name: 'La Cancha Sports Bar',
    tagline: 'El punto de reunión del fútbol en CDMX',
    address: 'Av. Presidente Masaryk 360, Polanco, CDMX',
    neighborhood: 'Polanco', city: 'cdmx',
    lat: 19.4326, lng: -99.1924,
    features: ['multiple_screens', 'outdoor_patio', 'full_kitchen', 'watch_party_host', 'food_packages'],
    orderAheadAvailable: true, capacity: 350, rating: 4.9, reviewCount: 3421,
    priceLevel: 2, phone: '+52 55 5555 0192',
    depositRequired: true, depositAmount: 500, currency: 'MXN',
    imageGradient: 'from-green-900 to-zinc-900',
  },
  {
    id: 'cdmx-pub-002', name: 'El Grito Sports Club',
    tagline: 'Donde México gana siempre',
    address: 'Álvaro Obregón 110, Roma Norte, CDMX',
    neighborhood: 'Roma Norte', city: 'cdmx',
    lat: 19.4197, lng: -99.1628,
    features: ['craft_beer', 'cocktail_bar', 'multiple_screens', 'standing_room', 'fan_zone'],
    orderAheadAvailable: true, capacity: 200, rating: 4.7, reviewCount: 1876,
    priceLevel: 2, phone: '+52 55 5555 0341',
    depositRequired: false, currency: 'MXN',
    imageGradient: 'from-red-900 to-zinc-900',
  },
  {
    id: 'cdmx-pub-003', name: 'Estadio Bar',
    tagline: 'La experiencia del estadio en tu barrio',
    address: 'Condesa 45, Condesa, CDMX',
    neighborhood: 'Condesa', city: 'cdmx',
    lat: 19.4111, lng: -99.1741,
    features: ['outdoor_patio', 'vip_section', 'full_kitchen', 'bottle_service'],
    orderAheadAvailable: true, capacity: 300, rating: 4.6, reviewCount: 2108,
    priceLevel: 3, phone: '+52 55 5555 0478',
    depositRequired: true, depositAmount: 750, currency: 'MXN',
    imageGradient: 'from-amber-900 to-zinc-900',
  },
  {
    id: 'cdmx-pub-004', name: 'Zona de Gol',
    tagline: '100% fútbol, 100% México',
    address: 'Paseo de la Reforma 222, Cuauhtémoc, CDMX',
    neighborhood: 'Reforma', city: 'cdmx',
    lat: 19.4269, lng: -99.1685,
    features: ['multiple_screens', 'standing_room', 'food_packages', 'watch_party_host'],
    orderAheadAvailable: true, capacity: 500, rating: 4.5, reviewCount: 4201,
    priceLevel: 2, phone: '+52 55 5555 0512',
    depositRequired: false, currency: 'MXN',
    imageGradient: 'from-emerald-900 to-zinc-900',
  },
];

const PUBS_TORONTO: Pub[] = [
  {
    id: 'tor-pub-001', name: 'Maple Leaf Pub & Kitchen',
    tagline: "Canada's team deserves Canada's bar",
    address: '279 King St W, Toronto, ON M5V 1J5',
    neighborhood: 'King West', city: 'toronto',
    lat: 43.6468, lng: -79.3913,
    features: ['multiple_screens', 'full_kitchen', 'craft_beer', 'watch_party_host', 'food_packages'],
    orderAheadAvailable: true, capacity: 240, rating: 4.8, reviewCount: 1893,
    priceLevel: 2, phone: '+1 (416) 555-0192',
    depositRequired: true, depositAmount: 30, currency: 'CAD',
    imageGradient: 'from-red-900 to-zinc-900',
  },
  {
    id: 'tor-pub-002', name: 'The Corner Kick',
    tagline: "Toronto's football hub since 2010",
    address: '580 College St, Toronto, ON M6G 1B3',
    neighborhood: 'Little Italy', city: 'toronto',
    lat: 43.6551, lng: -79.4108,
    features: ['outdoor_patio', 'craft_beer', 'private_booths', 'watch_party_host'],
    orderAheadAvailable: true, capacity: 160, rating: 4.7, reviewCount: 1241,
    priceLevel: 2, phone: '+1 (416) 555-0347',
    depositRequired: false, currency: 'CAD',
    imageGradient: 'from-sky-900 to-zinc-900',
  },
  {
    id: 'tor-pub-003', name: 'Champions Sports Bar',
    tagline: 'Giant screens, cold Molsons, louder cheers',
    address: '1 Blue Jays Way, Toronto, ON M5V 1J1',
    neighborhood: 'Entertainment District', city: 'toronto',
    lat: 43.6414, lng: -79.3893,
    features: ['multiple_screens', 'vip_section', 'cocktail_bar', 'standing_room', 'fan_zone'],
    orderAheadAvailable: true, capacity: 450, rating: 4.6, reviewCount: 2987,
    priceLevel: 3, phone: '+1 (416) 555-0558',
    depositRequired: true, depositAmount: 40, currency: 'CAD',
    imageGradient: 'from-violet-900 to-zinc-900',
  },
];

const PUBS_NY: Pub[] = [
  {
    id: 'ny-pub-001', name: 'The Soccer Bar NYC',
    tagline: "NYC's most-loved football bar",
    address: '258 W 15th St, New York, NY 10011',
    neighborhood: 'Chelsea', city: 'ny',
    lat: 40.7412, lng: -74.0012,
    features: ['multiple_screens', 'craft_beer', 'watch_party_host', 'private_booths', 'fan_zone'],
    orderAheadAvailable: true, capacity: 200, rating: 4.9, reviewCount: 4782,
    priceLevel: 2, phone: '+1 (212) 555-0192',
    depositRequired: true, depositAmount: 35, currency: 'USD',
    imageGradient: 'from-sky-900 to-zinc-900',
  },
  {
    id: 'ny-pub-002', name: 'Legends NYC',
    tagline: 'Where the world watches the world',
    address: '6 W 33rd St, New York, NY 10001',
    neighborhood: 'Midtown', city: 'ny',
    lat: 40.7484, lng: -73.9967,
    features: ['multiple_screens', 'vip_section', 'full_kitchen', 'cocktail_bar', 'bottle_service'],
    orderAheadAvailable: true, capacity: 600, rating: 4.7, reviewCount: 8921,
    priceLevel: 3, phone: '+1 (212) 555-0477',
    depositRequired: true, depositAmount: 60, currency: 'USD',
    imageGradient: 'from-amber-900 to-zinc-900',
  },
  {
    id: 'ny-pub-003', name: 'Woodside Wanderers',
    tagline: "Queens' most passionate football community",
    address: '59-10 Woodside Ave, Queens, NY 11377',
    neighborhood: 'Woodside, Queens', city: 'ny',
    lat: 40.7514, lng: -73.9061,
    features: ['outdoor_patio', 'multiple_screens', 'craft_beer', 'food_packages', 'standing_room'],
    orderAheadAvailable: true, capacity: 180, rating: 4.8, reviewCount: 2341,
    priceLevel: 1, phone: '+1 (718) 555-0238',
    depositRequired: false, currency: 'USD',
    imageGradient: 'from-green-900 to-zinc-900',
  },
  {
    id: 'ny-pub-004', name: 'Hudson & Ball',
    tagline: 'Upscale watch parties on the High Line',
    address: '848 Washington St, New York, NY 10014',
    neighborhood: 'West Village', city: 'ny',
    lat: 40.7408, lng: -74.0082,
    features: ['outdoor_patio', 'cocktail_bar', 'vip_section', 'private_booths', 'watch_party_host'],
    orderAheadAvailable: true, capacity: 250, rating: 4.6, reviewCount: 1567,
    priceLevel: 3, phone: '+1 (212) 555-0614',
    depositRequired: true, depositAmount: 50, currency: 'USD',
    imageGradient: 'from-emerald-900 to-zinc-900',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — MENU ITEMS (by currency zone)
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_USD: MenuItem[] = [
  { id: 'u1', name: 'Match Day Lager', description: 'Crisp house lager on draft', price: 9, currency: 'USD', category: 'beer', popular: true, emoji: '🍺' },
  { id: 'u2', name: 'IPA Flight (4)', description: 'Local craft IPA tasting flight', price: 18, currency: 'USD', category: 'beer', emoji: '🍺' },
  { id: 'u3', name: 'The Penalty Shot', description: 'Tequila, lime, tajín rim', price: 7, currency: 'USD', category: 'shot', popular: true, emoji: '🥃' },
  { id: 'u4', name: 'Stadium Margarita', description: 'Blanco tequila, cointreau, fresh lime', price: 15, currency: 'USD', category: 'cocktail', emoji: '🍹' },
  { id: 'u5', name: "Half-Time Nachos", description: 'Loaded nachos, jalapeños, sour cream', price: 18, currency: 'USD', category: 'snack', popular: true, emoji: '🧀' },
  { id: 'u6', name: 'Watch Party Wings (12)', description: 'Choice of 3 sauces, celery & ranch', price: 22, currency: 'USD', category: 'snack', emoji: '🍗' },
  { id: 'u7', name: 'Table Package (4 ppl)', description: 'Pitcher of beer + 2 shareable bites', price: 65, currency: 'USD', category: 'package', popular: true, emoji: '🎉' },
  { id: 'u8', name: 'Sparkling Water', description: 'Sanpellegrino 750ml', price: 6, currency: 'USD', category: 'non_alcoholic', emoji: '💧' },
];

export const MENU_MXN: MenuItem[] = [
  { id: 'm1', name: 'Modelo Especial', description: 'Botella fría directa del barril', price: 75, currency: 'MXN', category: 'beer', popular: true, emoji: '🍺' },
  { id: 'm2', name: 'Michelada de la Casa', description: 'Cerveza, clamato, limón, salsa', price: 120, currency: 'MXN', category: 'beer', popular: true, emoji: '🍺' },
  { id: 'm3', name: 'Shot de Mezcal', description: 'Mezcal artesanal oaxaqueño', price: 95, currency: 'MXN', category: 'shot', emoji: '🥃' },
  { id: 'm4', name: 'Paloma Gol', description: 'Tequila, toronja, soda, sal', price: 160, currency: 'MXN', category: 'cocktail', emoji: '🍹' },
  { id: 'm5', name: 'Orden de Tacos (3)', description: 'Al pastor, carnitas o suadero', price: 120, currency: 'MXN', category: 'main', popular: true, emoji: '🌮' },
  { id: 'm6', name: 'Quesadilla Grande', description: 'Flor de calabaza y requesón o queso', price: 95, currency: 'MXN', category: 'snack', emoji: '🧀' },
  { id: 'm7', name: 'Paquete de la Barra (4 pax)', description: 'Jarra de cerveza + 2 órdenes de tacos', price: 580, currency: 'MXN', category: 'package', popular: true, emoji: '🎉' },
  { id: 'm8', name: 'Agua Fresca del Día', description: 'Jamaica, horchata o tamarindo', price: 55, currency: 'MXN', category: 'non_alcoholic', emoji: '💧' },
];

export const MENU_CAD: MenuItem[] = [
  { id: 'c1', name: 'Molson Canadian', description: 'Classic Canadian lager, ice cold', price: 9, currency: 'CAD', category: 'beer', popular: true, emoji: '🍺' },
  { id: 'c2', name: 'Craft Pint', description: "Today's local Ontario craft on tap", price: 12, currency: 'CAD', category: 'beer', emoji: '🍺' },
  { id: 'c3', name: 'Maple Whisky Shot', description: 'Canadian Whisky, dash of maple', price: 10, currency: 'CAD', category: 'shot', emoji: '🥃' },
  { id: 'c4', name: 'Toronto Sour', description: 'Rye whisky, lemon, egg white, bitters', price: 17, currency: 'CAD', category: 'cocktail', emoji: '🍹' },
  { id: 'c5', name: 'Poutine Snack', description: "Quebec curds, gravy, house-cut fries", price: 16, currency: 'CAD', category: 'snack', popular: true, emoji: '🍟' },
  { id: 'c6', name: 'Match Day Burger', description: 'Smash burger, cheddar, pickles, fry sauce', price: 24, currency: 'CAD', category: 'main', popular: true, emoji: '🍔' },
  { id: 'c7', name: 'Group Pack (4 ppl)', description: 'Pitcher + 2 snacks + 4 shots', price: 89, currency: 'CAD', category: 'package', popular: true, emoji: '🎉' },
  { id: 'c8', name: 'Soft Drink', description: 'Pepsi, Ginger Ale, or Club Soda', price: 4, currency: 'CAD', category: 'non_alcoholic', emoji: '🥤' },
];

export const MENU_BY_CURRENCY: Record<'USD' | 'MXN' | 'CAD', MenuItem[]> = {
  USD: MENU_USD,
  MXN: MENU_MXN,
  CAD: MENU_CAD,
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — FREE ACTIVITIES (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

const FREE_LA: FreeActivity[] = [
  {
    id: 'la-free-1',
    name: 'Griffith Park Observatory Trail',
    category: 'trail',
    distance: '8.2 km from SoFi',
    description: 'Switchback trail through chaparral to the observatory terrace and city-wide views.',
    tip: 'Go 45 minutes before sunset — parking on East Observatory Rd fills by 6 PM on weekends.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Griffith Observatory Trail, Los Angeles, CA',
  },
  {
    id: 'la-free-2',
    name: 'Venice Beach Boardwalk',
    category: 'viewpoint',
    distance: '12.4 km from SoFi',
    description: 'Oceanfront promenade with street performers, Muscle Beach, and skate plaza.',
    tip: 'Walk north to the drum circle near Brooks Ave after 3 PM for the best free show.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Venice Beach Boardwalk, Venice, CA',
  },
  {
    id: 'la-free-3',
    name: 'The Getty Center',
    category: 'landmark',
    distance: '14.1 km from SoFi',
    description: 'Free admission always — gardens, architecture, and European art collections.',
    tip: 'Reserve a free timed ticket online; tram from parking is included.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'The Getty Center, Los Angeles, CA',
  },
  {
    id: 'la-free-4',
    name: 'Grand Park DTLA',
    category: 'park',
    distance: '11.8 km from SoFi',
    description: 'Central lawn between City Hall and The Music Center with fountains and shade.',
    tip: 'Bring a blanket for lunch — food trucks line Broadway on Thursdays.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Grand Park, Los Angeles, CA',
  },
  {
    id: 'la-free-5',
    name: 'Angels Walk Bunker Hill',
    category: 'trail',
    distance: '12.0 km from SoFi',
    description: 'Stair-street pedestrian path linking Bunker Hill to the Historic Core.',
    tip: 'Start at California Plaza and descend for shade; reverse climb if training for stadium stairs.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Angels Flight Bunker Hill, Los Angeles, CA',
  },
];

const FREE_CDMX: FreeActivity[] = [
  {
    id: 'cdmx-free-1',
    name: 'Bosque de Chapultepec',
    category: 'park',
    distance: '6.8 km from Azteca',
    description: 'Massive urban forest with lakes, museums, and Sunday ciclovía energy.',
    tip: 'Enter at Puerta de las Leones — rent paddle boats only if you have cash pesos.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Bosque de Chapultepec, Mexico City',
  },
  {
    id: 'cdmx-free-2',
    name: 'Zócalo Main Plaza',
    category: 'landmark',
    distance: '8.1 km from Azteca',
    description: 'One of the largest public squares in the world — cathedral, flag ceremony, street food.',
    tip: 'Flag lowering at 6 PM daily draws crowds; arrive 20 minutes early for a front spot.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Zócalo, Mexico City',
  },
  {
    id: 'cdmx-free-3',
    name: 'UNAM Ciudad Universitaria Murals',
    category: 'landmark',
    distance: '9.4 km from Azteca',
    description: 'Campus-wide mosaic murals by Juan O\'Gorman and David Alfaro Siqueiros.',
    tip: 'Metro Universidad station drops you at the Central Library facade — best photos at noon.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'UNAM Biblioteca Central, Ciudad de México',
  },
  {
    id: 'cdmx-free-4',
    name: 'Mercado de Artesanías La Ciudadela',
    category: 'market',
    distance: '7.6 km from Azteca',
    description: 'Covered artisan market for textiles, pottery, and lucha libre masks.',
    tip: 'Haggle politely after the second stall — first price is for tourists.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Mercado de Artesanías La Ciudadela, Mexico City',
  },
  {
    id: 'cdmx-free-5',
    name: 'Parque México Colonia Condesa',
    category: 'park',
    distance: '7.2 km from Azteca',
    description: 'Art deco park ringed by cafés — dog-friendly paths and weekend markets.',
    tip: 'Sunday tianguis along Amsterdam Ave starts at 10 AM — go before afternoon heat.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Parque México, Condesa, Mexico City',
  },
];

const FREE_TORONTO: FreeActivity[] = [
  {
    id: 'tor-free-1',
    name: 'Toronto Islands Walking Paths',
    category: 'trail',
    distance: '3.2 km from BMO Field',
    description: 'Ferry-access island trails with skyline views and picnic beaches.',
    tip: 'City ferry from Bay St costs ~$9 round trip — bikes rent on Ward\'s Island.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Toronto Islands Ferry, Toronto, ON',
  },
  {
    id: 'tor-free-2',
    name: 'Distillery Historic District',
    category: 'landmark',
    distance: '2.8 km from BMO Field',
    description: 'Victorian industrial lanes converted to cobblestone galleries and cafés.',
    tip: 'Weekday mornings are quietest — brick alleys photograph best before noon.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Distillery District, Toronto, ON',
  },
  {
    id: 'tor-free-3',
    name: 'Scarborough Bluffs Trail',
    category: 'trail',
    distance: '18 km from BMO Field',
    description: 'Clifftop walk above Lake Ontario with dramatic erosion viewpoints.',
    tip: 'Stay behind fence lines — bluff edges collapse without warning after storms.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Scarborough Bluffs Trail, Toronto, ON',
  },
  {
    id: 'tor-free-4',
    name: 'Kensington Market',
    category: 'market',
    distance: '4.1 km from BMO Field',
    description: 'Open-air blocks of vintage shops, global street food, and mural alleys.',
    tip: 'Pedestrian Sundays close streets to cars — best vibe 11 AM to 4 PM.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Kensington Market, Toronto, ON',
  },
  {
    id: 'tor-free-5',
    name: 'High Park Trails & Cherry Blossoms',
    category: 'park',
    distance: '5.6 km from BMO Field',
    description: '400-acre park with zoo-free trails and spring sakura groves.',
    tip: 'Cherry bloom peaks late April — enter via Bloor St gate to skip parking chaos.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'High Park, Toronto, ON',
  },
];

const FREE_NY: FreeActivity[] = [
  {
    id: 'ny-free-1',
    name: 'The High Line',
    category: 'trail',
    distance: '9.1 km from MetLife',
    description: 'Elevated park on a former freight rail line with Hudson River views.',
    tip: 'Start at Gansevoort St and walk north — fewer stairs than entering mid-park.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'The High Line, New York, NY',
  },
  {
    id: 'ny-free-2',
    name: 'Staten Island Ferry',
    category: 'viewpoint',
    distance: '12 km from MetLife',
    description: 'Free round-trip harbor cruise with full Manhattan skyline and Statue of Liberty views.',
    tip: 'Stand on the starboard side leaving Manhattan — Lady Liberty passes on the right.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Staten Island Ferry Whitehall Terminal, New York, NY',
  },
  {
    id: 'ny-free-3',
    name: 'Brooklyn Bridge Pedestrian Walkway',
    category: 'trail',
    distance: '11 km from MetLife',
    description: 'Wooden boardwalk above traffic with Gothic tower photo stops.',
    tip: 'Enter from Brooklyn (DUMBO) toward Manhattan for downhill finish and shade.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Brooklyn Bridge Pedestrian Walk, New York, NY',
  },
  {
    id: 'ny-free-4',
    name: 'Governors Island',
    category: 'park',
    distance: '10 km from MetLife',
    description: 'Car-free island with hammocks, art installations, and harbor breezes.',
    tip: 'Free entry on weekend mornings before 10 AM — ferry from Battery Maritime Building.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Governors Island Ferry, New York, NY',
  },
  {
    id: 'ny-free-5',
    name: 'Oculus at World Trade Center',
    category: 'landmark',
    distance: '10.5 km from MetLife',
    description: 'Calatrava white-rib transit hall and 9/11 memorial edge.',
    tip: 'Walk through at noon when light shafts through the spine — connect to E train hub below.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Oculus World Trade Center, New York, NY',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — CITIES MATRIX
// ─────────────────────────────────────────────────────────────────────────────

const CITY_CENTERS: Record<CityId, { lat: number; lng: number }> = {
  la:      { lat: 34.0522,  lng: -118.2437 },
  cdmx:    { lat: 19.4326,  lng: -99.1332  },
  toronto: { lat: 43.6532,  lng: -79.3832  },
  ny:      { lat: 40.7128,  lng: -74.0060  },
};

// Extended centers include non-World-Cup cities that have city intelligence
// data. Used only for GPS nearest-city detection; does not affect the World
// Cup city selector or CITIES array.
const EXTENDED_CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  ...CITY_CENTERS,
  'little-rock': { lat: 34.7465, lng: -92.2896 },
};

function isCityId(key: string): key is CityId {
  return key === 'la' || key === 'cdmx' || key === 'toronto' || key === 'ny';
}

export const CITIES: CityData[] = [
  {
    id: 'la', name: 'Los Angeles', displayName: 'Los Angeles', shortName: 'LA',
    lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles',
    country: 'United States', countryCode: 'US', emoji: '🇺🇸',
    matches: MATCHES_LA, pubs: PUBS_LA, stadiums: [STADIUMS.sofi],
    freeActivities: FREE_LA,
  },
  {
    id: 'cdmx', name: 'Mexico City', displayName: 'Ciudad de México', shortName: 'CDMX',
    lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City',
    country: 'Mexico', countryCode: 'MX', emoji: '🇲🇽',
    matches: MATCHES_CDMX, pubs: PUBS_CDMX, stadiums: [STADIUMS.azteca],
    freeActivities: FREE_CDMX,
  },
  {
    id: 'toronto', name: 'Toronto', displayName: 'Toronto', shortName: 'YYZ',
    lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto',
    country: 'Canada', countryCode: 'CA', emoji: '🇨🇦',
    matches: MATCHES_TORONTO, pubs: PUBS_TORONTO, stadiums: [STADIUMS.bmo],
    freeActivities: FREE_TORONTO,
  },
  {
    id: 'ny', name: 'New York / New Jersey', displayName: 'New York / NJ', shortName: 'NY/NJ',
    lat: 40.7128, lng: -74.0060, timezone: 'America/New_York',
    country: 'United States', countryCode: 'US', emoji: '🗽',
    matches: MATCHES_NY, pubs: PUBS_NY, stadiums: [STADIUMS.metlife],
    freeActivities: FREE_NY,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// THE HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useMatchdayEngine(): MatchdayEngineReturn {
  const [selectedCityId, setSelectedCityId] = useState<CityId>(() => {
    const stored = localStorage.getItem(LS_CITY_KEY);
    return (stored as CityId) || 'la';
  });

  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_LEADS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  const rawCity = CITIES.find((c) => c.id === selectedCityId) ?? CITIES[0];

  const pubsWithDistance: Pub[] = rawCity.pubs
    .map((pub) => ({
      ...pub,
      distanceKm:
        geo.lat != null && geo.lng != null
          ? haversineKm(geo.lat, geo.lng, pub.lat, pub.lng)
          : haversineKm(rawCity.lat, rawCity.lng, pub.lat, pub.lng),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  const selectedCity: CityData = { ...rawCity, pubs: pubsWithDistance };

  const now = Date.now();
  const upcomingMatches = [...rawCity.matches]
    .filter((m) => {
      const kickoff = new Date(m.kickoffISO).getTime();
      return kickoff > now - 115 * 60 * 1000; // include live window
    })
    .sort((a, b) => new Date(a.kickoffISO).getTime() - new Date(b.kickoffISO).getTime());

  const nextMatch = upcomingMatches[0] ?? null;

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!nextMatch) { setCountdown(null); return; }

    const tick = () => setCountdown(computeCountdown(nextMatch.kickoffISO));
    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextMatch?.id]);

  // ── Geolocation ────────────────────────────────────────────────────────────

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo({ status: 'unsupported' });
      return;
    }
    setGeo({ status: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        let closestKey = 'la';
        let minDist = Infinity;
        for (const [key, center] of Object.entries(EXTENDED_CITY_CENTERS)) {
          const d = haversineKm(lat, lng, center.lat, center.lng);
          if (d < minDist) { minDist = d; closestKey = key; }
        }
        setGeo({ status: 'granted', lat, lng, closestCityId: closestKey });
        // Only update World Cup city selector for known CityId values.
        // Extended keys (e.g. 'little-rock') are resolved by cityDataRouter.
        if (isCityId(closestKey)) {
          setSelectedCityId(closestKey);
          localStorage.setItem(LS_CITY_KEY, closestKey);
        }
      },
      (err) => setGeo({ status: 'denied', error: err.message }),
      { timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  // ── City selection ─────────────────────────────────────────────────────────

  const selectCity = useCallback((cityId: CityId) => {
    setSelectedCityId(cityId);
    localStorage.setItem(LS_CITY_KEY, cityId);
  }, []);

  // ── Lead saving ────────────────────────────────────────────────────────────

  const saveLead = useCallback(
    (leadData: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead => {
      const newLead: Lead = {
        ...leadData,
        id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setLeads((prev) => {
        const updated = [...prev, newLead];
        localStorage.setItem(LS_LEADS_KEY, JSON.stringify(updated));
        return updated;
      });
      return newLead;
    },
    []
  );

  return {
    cities: CITIES,
    selectedCityId,
    selectedCity,
    upcomingMatches,
    nextMatch,
    countdown,
    geo,
    leads,
    selectCity,
    requestGeo,
    saveLead,
  };
}
