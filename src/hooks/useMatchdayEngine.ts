// ============================================================
// Universal MatchDay Shovel — The Engine
// 4-City World Cup 2026 Data Matrix + Geo + Countdown + Leads
// Phase 2: freeActivities added per city. Nothing removed.
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  CityId, CityData, Match, Pub, Stadium, Team, MenuItem,
  CountdownState, GeoState, Lead, CartItem,
  MatchdayEngineReturn, FreeActivity,
} from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
  const MATCH_WINDOW_MS = 115 * 60 * 1000;

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

const LS_CITY_KEY  = 'mds_selected_city';
const LS_LEADS_KEY = 'mds_leads';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — STADIUMS
// ─────────────────────────────────────────────────────────────────────────────

const STADIUMS: Record<string, Stadium> = {
  sofi: {
    id: 'sofi', name: 'SoFi Stadium', city: 'la',
    address: '1001 Stadium Dr, Inglewood, CA 90301',
    lat: 33.9535, lng: -118.3392, capacity: 70240,
  },
  azteca: {
    id: 'azteca', name: 'Estadio Azteca', city: 'cdmx',
    address: 'Calzada de Tlalpan 3465, CDMX 04650',
    lat: 19.3029, lng: -99.1505, capacity: 87000,
  },
  bmo: {
    id: 'bmo', name: 'BMO Field', city: 'toronto',
    address: '170 Princes Blvd, Toronto, ON M6K 3C3',
    lat: 43.6333, lng: -79.4187, capacity: 45000,
  },
  metlife: {
    id: 'metlife', name: 'MetLife Stadium', city: 'ny',
    address: '1 MetLife Stadium Dr, East Rutherford, NJ 07073',
    lat: 40.8135, lng: -74.0745, capacity: 82500,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — TEAMS
// ─────────────────────────────────────────────────────────────────────────────

const T: Record<string, Team> = {
  USA: { code: 'USA', name: 'United States',  flag: '🇺🇸' },
  MEX: { code: 'MEX', name: 'Mexico',         flag: '🇲🇽' },
  CAN: { code: 'CAN', name: 'Canada',         flag: '🇨🇦' },
  ARG: { code: 'ARG', name: 'Argentina',      flag: '🇦🇷' },
  BRA: { code: 'BRA', name: 'Brazil',         flag: '🇧🇷' },
  ENG: { code: 'ENG', name: 'England',        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  FRA: { code: 'FRA', name: 'France',         flag: '🇫🇷' },
  ESP: { code: 'ESP', name: 'Spain',          flag: '🇪🇸' },
  GER: { code: 'GER', name: 'Germany',        flag: '🇩🇪' },
  POR: { code: 'POR', name: 'Portugal',       flag: '🇵🇹' },
  MAR: { code: 'MAR', name: 'Morocco',        flag: '🇲🇦' },
  JPN: { code: 'JPN', name: 'Japan',          flag: '🇯🇵' },
  NED: { code: 'NED', name: 'Netherlands',    flag: '🇳🇱' },
  URU: { code: 'URU', name: 'Uruguay',        flag: '🇺🇾' },
  COL: { code: 'COL', name: 'Colombia',       flag: '🇨🇴' },
  SEN: { code: 'SEN', name: 'Senegal',        flag: '🇸🇳' },
  AUS: { code: 'AUS', name: 'Australia',      flag: '🇦🇺' },
  KOR: { code: 'KOR', name: 'South Korea',    flag: '🇰🇷' },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — MATCHES
// ─────────────────────────────────────────────────────────────────────────────

const MATCHES_LA: Match[] = [
  { id: 'la-001', homeTeam: T.USA, awayTeam: T.POR,
    kickoffISO: '2026-06-12T01:00:00Z', stadium: STADIUMS.sofi,
    phase: 'group', phaseLabel: 'Group B', tvChannel: 'FOX' },
  { id: 'la-002', homeTeam: T.ARG, awayTeam: T.AUS,
    kickoffISO: '2026-06-17T22:00:00Z', stadium: STADIUMS.sofi,
    phase: 'group', phaseLabel: 'Group D', tvChannel: 'FS1' },
  { id: 'la-003', homeTeam: T.ENG, awayTeam: T.SEN,
    kickoffISO: '2026-06-22T01:00:00Z', stadium: STADIUMS.sofi,
    phase: 'group', phaseLabel: 'Group C', tvChannel: 'FOX' },
  { id: 'la-004', homeTeam: T.BRA, awayTeam: T.URU,
    kickoffISO: '2026-07-10T01:00:00Z', stadium: STADIUMS.sofi,
    phase: 'quarterfinal', phaseLabel: 'Quarterfinal', tvChannel: 'FOX' },
  { id: 'la-005', homeTeam: T.USA, awayTeam: T.MEX,
    kickoffISO: '2026-07-15T01:00:00Z', stadium: STADIUMS.sofi,
    phase: 'semifinal', phaseLabel: 'Semifinal', tvChannel: 'FOX' },
];

const MATCHES_CDMX: Match[] = [
  { id: 'cdmx-001', homeTeam: T.MEX, awayTeam: T.KOR,
    kickoffISO: '2026-06-11T20:00:00Z', stadium: STADIUMS.azteca,
    phase: 'group', phaseLabel: 'Group A — Opening Match', tvChannel: 'Azteca / Telemundo' },
  { id: 'cdmx-002', homeTeam: T.ARG, awayTeam: T.COL,
    kickoffISO: '2026-06-16T23:00:00Z', stadium: STADIUMS.azteca,
    phase: 'group', phaseLabel: 'Group E', tvChannel: 'Telemundo' },
  { id: 'cdmx-003', homeTeam: T.MAR, awayTeam: T.BRA,
    kickoffISO: '2026-06-21T23:00:00Z', stadium: STADIUMS.azteca,
    phase: 'group', phaseLabel: 'Group F', tvChannel: 'Azteca' },
  { id: 'cdmx-004', homeTeam: T.MEX, awayTeam: T.URU,
    kickoffISO: '2026-06-30T01:00:00Z', stadium: STADIUMS.azteca,
    phase: 'round_of_32', phaseLabel: 'Round of 32', tvChannel: 'Azteca / Telemundo' },
];

const MATCHES_TORONTO: Match[] = [
  { id: 'tor-001', homeTeam: T.CAN, awayTeam: T.MAR,
    kickoffISO: '2026-06-13T20:00:00Z', stadium: STADIUMS.bmo,
    phase: 'group', phaseLabel: 'Group A', tvChannel: 'TSN / CTV' },
  { id: 'tor-002', homeTeam: T.FRA, awayTeam: T.JPN,
    kickoffISO: '2026-06-18T23:00:00Z', stadium: STADIUMS.bmo,
    phase: 'group', phaseLabel: 'Group G', tvChannel: 'TSN' },
  { id: 'tor-003', homeTeam: T.CAN, awayTeam: T.NED,
    kickoffISO: '2026-06-24T22:00:00Z', stadium: STADIUMS.bmo,
    phase: 'group', phaseLabel: 'Group A', tvChannel: 'TSN / CTV' },
  { id: 'tor-004', homeTeam: T.GER, awayTeam: T.POR,
    kickoffISO: '2026-07-05T22:00:00Z', stadium: STADIUMS.bmo,
    phase: 'round_of_16', phaseLabel: 'Round of 16', tvChannel: 'TSN' },
];

const MATCHES_NY: Match[] = [
  { id: 'ny-001', homeTeam: T.ENG, awayTeam: T.FRA,
    kickoffISO: '2026-06-14T22:00:00Z', stadium: STADIUMS.metlife,
    phase: 'group', phaseLabel: 'Group C', tvChannel: 'FOX' },
  { id: 'ny-002', homeTeam: T.BRA, awayTeam: T.GER,
    kickoffISO: '2026-06-19T23:00:00Z', stadium: STADIUMS.metlife,
    phase: 'group', phaseLabel: 'Group H', tvChannel: 'FS1' },
  { id: 'ny-003', homeTeam: T.USA, awayTeam: T.ESP,
    kickoffISO: '2026-06-25T23:00:00Z', stadium: STADIUMS.metlife,
    phase: 'group', phaseLabel: 'Group B', tvChannel: 'FOX' },
  { id: 'ny-004', homeTeam: T.ARG, awayTeam: T.ENG,
    kickoffISO: '2026-07-07T22:00:00Z', stadium: STADIUMS.metlife,
    phase: 'round_of_16', phaseLabel: 'Round of 16', tvChannel: 'FOX' },
  { id: 'ny-005', homeTeam: T.BRA, awayTeam: T.FRA,
    kickoffISO: '2026-07-19T20:00:00Z', stadium: STADIUMS.metlife,
    phase: 'final', phaseLabel: '🏆 THE WORLD CUP FINAL', tvChannel: 'FOX / Telemundo' },
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
    vibe: 'sports bar craft beer pint',
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
    vibe: 'cocktail bar nightlife rooftop',
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
    vibe: 'sports bar pub beer kitchen',
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
    vibe: 'craft beer garden pint pub',
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
    vibe: 'sports bar cantina beer',
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
    vibe: 'craft beer cocktail bar sports',
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
    vibe: 'bar nightlife cocktail bottle service',
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
    vibe: 'sports fan zone stadium atmosphere',
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
    vibe: 'pub bar craft beer kitchen',
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
    vibe: 'craft beer pint pub outdoor',
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
    vibe: 'sports bar cocktail nightlife entertainment',
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
    vibe: 'sports bar pub craft beer fan zone',
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
    vibe: 'cocktail bar nightlife bottle service lounge',
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
    vibe: 'craft beer pub community outdoor',
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
    vibe: 'cocktail lounge bar upscale nightlife',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — MENU ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export const MENU_USD: MenuItem[] = [
  { id: 'u1', name: 'Match Day Lager', description: 'Crisp house lager on draft', price: 9, currency: 'USD', category: 'beer', popular: true, emoji: '🍺' },
  { id: 'u2', name: 'IPA Flight (4)', description: 'Local craft IPA tasting flight', price: 18, currency: 'USD', category: 'beer', emoji: '🍺' },
  { id: 'u3', name: 'The Penalty Shot', description: 'Tequila, lime, tajín rim', price: 7, currency: 'USD', category: 'shot', popular: true, emoji: '🥃' },
  { id: 'u4', name: 'Stadium Margarita', description: 'Blanco tequila, cointreau, fresh lime', price: 15, currency: 'USD', category: 'cocktail', emoji: '🍹' },
  { id: 'u5', name: 'Half-Time Nachos', description: 'Loaded nachos, jalapeños, sour cream', price: 18, currency: 'USD', category: 'snack', popular: true, emoji: '🧀' },
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
  { id: 'c5', name: 'Poutine Snack', description: 'Quebec curds, gravy, house-cut fries', price: 16, currency: 'CAD', category: 'snack', popular: true, emoji: '🍟' },
  { id: 'c6', name: 'Match Day Burger', description: 'Smash burger, cheddar, pickles, fry sauce', price: 24, currency: 'CAD', category: 'main', popular: true, emoji: '🍔' },
  { id: 'c7', name: 'Group Pack (4 ppl)', description: 'Pitcher + 2 snacks + 4 shots', price: 89, currency: 'CAD', category: 'package', popular: true, emoji: '🎉' },
  { id: 'c8', name: 'Soft Drink', description: 'Pepsi, Ginger Ale, or Club Soda', price: 4, currency: 'CAD', category: 'non_alcoholic', emoji: '🥤' },
];

export const MENU_BY_CURRENCY: Record<'USD' | 'MXN' | 'CAD', MenuItem[]> = {
  USD: MENU_USD, MXN: MENU_MXN, CAD: MENU_CAD,
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — FREE ACTIVITIES (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

const FREE_LA: FreeActivity[] = [
  {
    id: 'la-act-001',
    name: 'Griffith Observatory Trail',
    category: 'trail',
    distance: '3.2 km from SoFi',
    description: 'Hike the Mount Hollywood Trail to the observatory for a 360° view over the entire city and the Hollywood sign.',
    tip: 'Start before 8am to avoid the crowds. Parking is impossible after 10am on weekends.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Griffith Observatory Los Angeles',
  },
  {
    id: 'la-act-002',
    name: 'Venice Beach Boardwalk',
    category: 'landmark',
    distance: '12 km from SoFi',
    description: 'The 3-mile stretch of oceanfront boardwalk with street performers, skaters, murals, and the original Muscle Beach outdoor gym.',
    tip: 'Ocean Front Walk is free. Rent a bike at the south end — it\'s flat the whole way.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Venice Beach Boardwalk Los Angeles',
  },
  {
    id: 'la-act-003',
    name: 'The Getty Center',
    category: 'landmark',
    distance: '18 km from SoFi',
    description: 'Hilltop museum with permanent collection of European paintings, sculptures, and decorative arts — including Van Gogh\'s Irises. Admission is always free.',
    tip: 'Parking is $20 but the tram from the base lot is included. Go on a clear day for the ocean views.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'The Getty Center Los Angeles',
  },
  {
    id: 'la-act-004',
    name: 'Grand Park DTLA',
    category: 'park',
    distance: '22 km from SoFi',
    description: '12 acres of public park in the center of downtown between City Hall and the Music Center, with fountains, lawn areas, and free WiFi.',
    tip: 'The splash pad is free and open to kids. The adjacent Grand Central Market is worth 30 minutes.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Grand Park Los Angeles Downtown',
  },
  {
    id: 'la-act-005',
    name: 'Angels Walk Bunker Hill',
    category: 'trail',
    distance: '22 km from SoFi',
    description: 'A self-guided walking trail through DTLA\'s Bunker Hill neighborhood connecting the Grand Avenue Cultural Corridor — museums, concert hall, and rooftop gardens.',
    tip: 'Pick up the free map at MOCA or the Music Center entrance. The Broad Museum has free admission every first Thursday evening.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Angels Walk Bunker Hill Los Angeles',
  },
];

const FREE_CDMX: FreeActivity[] = [
  {
    id: 'cdmx-act-001',
    name: 'Bosque de Chapultepec',
    category: 'park',
    distance: '14 km from Azteca',
    description: 'The largest urban park in Latin America — 686 hectares of forest, lakes, and museums in the center of the city. The park itself is entirely free.',
    tip: 'The Museo de Arte Moderno inside the park is free on Sundays. Bring a blanket and food — locals picnic here on weekends.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Bosque de Chapultepec Ciudad de México',
  },
  {
    id: 'cdmx-act-002',
    name: 'El Zócalo',
    category: 'landmark',
    distance: '11 km from Azteca',
    description: 'The main plaza of Mexico City — one of the largest public squares in the world, directly above the buried ruins of the Aztec ceremonial center of Tenochtitlan.',
    tip: 'The changing of the guard at the National Palace happens at 6pm daily. The Templo Mayor ruins adjacent to the square charge admission but are visible through the fence.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Zócalo Ciudad de México',
  },
  {
    id: 'cdmx-act-003',
    name: 'UNAM Murals — Ciudad Universitaria',
    category: 'landmark',
    distance: '8 km from Azteca',
    description: 'The campus of the National Autonomous University of Mexico is a UNESCO World Heritage Site — the central library\'s exterior is covered in 7.5 million natural stone mosaic tiles representing pre-Hispanic and modern Mexican history.',
    tip: 'The campus is open to the public. Take Metro Line 3 to Copilco. The outdoor stadium \'El Estadio Olímpico\' has a Diego Rivera mosaic on its exterior.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'UNAM Ciudad Universitaria México',
  },
  {
    id: 'cdmx-act-004',
    name: 'Mercado de Artesanías La Ciudadela',
    category: 'market',
    distance: '12 km from Azteca',
    description: 'The largest artisan market in Mexico City — over 300 stalls selling handmade crafts from every state in Mexico, from Oaxacan textiles to Talavera ceramics. Browsing is free.',
    tip: 'Go Tuesday–Friday for the best selection and least crowds. Prices are negotiable — start at 60% of the first ask.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Mercado Artesanías La Ciudadela Ciudad de México',
  },
  {
    id: 'cdmx-act-005',
    name: 'Parque México — Colonia Condesa',
    category: 'park',
    distance: '13 km from Azteca',
    description: 'An art deco park built on the oval footprint of a 1920s racing circuit, surrounded by some of the most beautiful architecture in the city.',
    tip: 'The park fills up on Sunday mornings with yoga groups, dog walkers, and food vendors. The surrounding streets are worth 30 minutes of wandering.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Parque México Condesa Ciudad de México',
  },
];

const FREE_TORONTO: FreeActivity[] = [
  {
    id: 'tor-act-001',
    name: 'Toronto Islands Walking Paths',
    category: 'trail',
    distance: '8 km from BMO Field',
    description: 'A car-free island park in Toronto Harbour with 14 km of walking and cycling paths, beaches, and a view of the entire downtown skyline.',
    tip: 'The ferry costs $9 return. Once on the island, everything is free. Centreville Amusement Park has a per-ride fee but the island itself does not.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Toronto Islands Ferry Terminal',
  },
  {
    id: 'tor-act-002',
    name: 'Distillery Historic District',
    category: 'landmark',
    distance: '5 km from BMO Field',
    description: 'The best-preserved collection of Victorian industrial architecture in North America — the 1832 Gooderham & Worts distillery converted into galleries, restaurants, and public art.',
    tip: 'The galleries are free to enter. The Christmas Market in December is extremely crowded; any other weekend is better.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Distillery Historic District Toronto',
  },
  {
    id: 'tor-act-003',
    name: 'Scarborough Bluffs Trail',
    category: 'trail',
    distance: '22 km from BMO Field',
    description: '90-meter chalk-white cliffs along Lake Ontario formed 12,000 years ago at the end of the last ice age, with a trail along the top and a beach at the base.',
    tip: 'The Bluffer\'s Park beach at the base is accessible by car (free parking). The trail along the top is accessible from Scarborough Bluffs Park — different entrance, different mood.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Scarborough Bluffs Toronto',
  },
  {
    id: 'tor-act-004',
    name: 'Kensington Market',
    category: 'market',
    distance: '3 km from BMO Field',
    description: 'A bohemian open-air neighborhood market that has been a landing point for new immigrant communities for over 100 years — now filled with vintage shops, international food stalls, and street art.',
    tip: 'On the last Sunday of every month (May–October), the entire market closes to cars for Pedestrian Sundays. Best time to visit.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Kensington Market Toronto',
  },
  {
    id: 'tor-act-005',
    name: 'High Park — Trails & Cherry Blossoms',
    category: 'park',
    distance: '3 km from BMO Field',
    description: 'Toronto\'s largest public park — 161 hectares with free trails, a free zoo, and the city\'s famous cherry blossom grove that blooms each spring.',
    tip: 'The High Park Zoo is free every day. During cherry blossom season (late April) the park is packed — come on a weekday morning.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'High Park Toronto',
  },
];

const FREE_NY: FreeActivity[] = [
  {
    id: 'ny-act-001',
    name: 'The High Line',
    category: 'trail',
    distance: '35 km from MetLife',
    description: 'A 2.33-km elevated park built on a former freight railroad track above the streets of Manhattan\'s West Side, with gardens, public art, and views of the Hudson River.',
    tip: 'Enter at the Gansevoort Street entrance at the south end. Closes at 10pm. The stretch between 14th and 23rd Streets has the best food vendors.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'The High Line New York City',
  },
  {
    id: 'ny-act-002',
    name: 'Staten Island Ferry',
    category: 'viewpoint',
    distance: '40 km from MetLife',
    description: 'A free 25-minute ferry across New York Harbor with a direct view of the Statue of Liberty, the downtown Manhattan skyline, and the Verrazano-Narrows Bridge. Has been free since 1997.',
    tip: 'Board at the Whitehall Terminal in Lower Manhattan. The round trip takes about an hour and you never have to get off. Bring food.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Staten Island Ferry Whitehall Terminal New York',
  },
  {
    id: 'ny-act-003',
    name: 'Brooklyn Bridge Walk',
    category: 'trail',
    distance: '38 km from MetLife',
    description: 'The 1.8-km pedestrian and cycling path across the Brooklyn Bridge gives an unobstructed view of both the Manhattan and Brooklyn skylines and takes about 30 minutes on foot.',
    tip: 'Walk from Manhattan to Brooklyn (east), not the reverse — the views are better in that direction. Start at the City Hall Park entrance.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Brooklyn Bridge Pedestrian Walkway New York',
  },
  {
    id: 'ny-act-004',
    name: 'Governors Island',
    category: 'park',
    distance: '39 km from MetLife',
    description: 'A 172-acre car-free island in New York Harbor with 2.2 km of car-free promenade, public art installations, hammocks, a slide hill, and views of the Statue of Liberty. Free entry on weekends.',
    tip: 'The ferry from Pier 6 in Brooklyn is free on weekends before noon. Bikes are available to rent on the island. The island closes in October.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Governors Island New York',
  },
  {
    id: 'ny-act-005',
    name: 'Oculus at World Trade Center',
    category: 'landmark',
    distance: '37 km from MetLife',
    description: 'Santiago Calatrava\'s white ribbed transit hub at the World Trade Center site — a $4 billion public building with a skylight that opens directly toward the footprint of the North Tower. Always open, always free.',
    tip: 'The interior is best on a clear morning when the light comes through the skylight. On September 11 annually, the skylight panels are fully retracted.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Oculus World Trade Center New York',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA — CITY CENTER COORDINATES
// ─────────────────────────────────────────────────────────────────────────────

const CITY_CENTERS: Record<CityId, { lat: number; lng: number }> = {
  la:      { lat: 34.0522,  lng: -118.2437 },
  cdmx:    { lat: 19.4326,  lng: -99.1332  },
  toronto: { lat: 43.6532,  lng: -79.3832  },
  ny:      { lat: 40.7128,  lng: -74.0060  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CITIES MATRIX (exported so hooks can import directly)
// ─────────────────────────────────────────────────────────────────────────────

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

  const [geo, setGeo]     = useState<GeoState>({ status: 'idle' });
  const [countdown, setCountdown] = useState<CountdownState | null>(null);
  const [leads, setLeads] = useState<Lead[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_LEADS_KEY) || '[]'); }
    catch { return []; }
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  const rawCity = CITIES.find((c) => c.id === selectedCityId) ?? CITIES[0]!;

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
      return kickoff > now - 115 * 60 * 1000;
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

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextMatch?.id]);

  // ── Geolocation ────────────────────────────────────────────────────────────

  const requestGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeo({ status: 'unsupported' }); return; }
    setGeo({ status: 'requesting' });
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        let closestId: CityId = 'la';
        let minDist = Infinity;
        for (const [cityId, center] of Object.entries(CITY_CENTERS) as [CityId, { lat: number; lng: number }][]) {
          const d = haversineKm(lat, lng, center.lat, center.lng);
          if (d < minDist) { minDist = d; closestId = cityId; }
        }
        setGeo({ status: 'granted', lat, lng, closestCityId: closestId });
        setSelectedCityId(closestId);
        localStorage.setItem(LS_CITY_KEY, closestId);
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
