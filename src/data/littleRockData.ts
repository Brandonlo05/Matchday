// ============================================================
// MatchDay — Little Rock City Intelligence Data
// ============================================================

import type { AIUserProfile } from '../context/AIUserContext';

// ─── PROFILE MATCH TAG TYPE ───────────────────────────────────
// Union of all string-valued profile axes. historyInterest is
// boolean and cannot appear here; use historicalBadge.active
// as the signal for history-interest matching in consuming components.

export type ProfileMatchTag =
  | AIUserProfile['pace']
  | AIUserProfile['cognitiveStyle']
  | AIUserProfile['fuelSource']
  | AIUserProfile['socialDynamic']
  | AIUserProfile['culturalTribe'];

// ─── INTERFACES ───────────────────────────────────────────────

export interface LRRestaurant {
  id: string;
  name: string;
  description: string;
  url: string;
  profileMatchTags: ProfileMatchTag[];
  historicalBadge: {
    active: boolean;
    copy: string;
  };
}

export interface LRTransitOption {
  id: string;
  name: string;
  category: 'Flash Rapid Selection' | 'Free / Public Selection';
  description: string;
  fare: string;
}

export interface LRSportsTeam {
  id: string;
  name: string;
  description: string;
  venue: string;
  ticketUrl: string | null;
  showLiveScore: boolean;
}

export interface LRTrail {
  id: string;
  name: string;
  tab: 'Top Trails' | 'Best Trails for Views';
  caption: string;
  mapsQuery: string;
}

// ─── LITTLE ROCK DATA ────────────────────────────────────────

const restaurants: LRRestaurant[] = [
  {
    id: 'lr-rest-001',
    name: 'Brave New Restaurant',
    description: 'Riverfront dining balcony',
    url: 'https://bravenewrestaurant.com/',
    profileMatchTags: ['Leisurely Flâneur', 'The Unwinder'],
    historicalBadge: { active: false, copy: '' },
  },
  {
    id: 'lr-rest-002',
    name: 'The Root Cafe',
    description: 'Farm-to-table artisan',
    url: 'https://www.therootcafe.com/',
    profileMatchTags: ['Solo Nomad', 'Coffee'],
    historicalBadge: { active: false, copy: '' },
  },
  {
    id: 'lr-rest-003',
    name: 'Capital Hotel Bar and Grill',
    description: 'Historic downtown hotel dining and bar',
    url: 'https://www.capitalhotel.com/',
    profileMatchTags: ['The Romantic'],
    historicalBadge: {
      active: true,
      copy: 'Dating back to 1870, host to presidents and the deep Southern lore that shaped an entire state.',
    },
  },
];

const transitOptions: LRTransitOption[] = [
  {
    id: 'lr-transit-001',
    name: 'METRO Streetcar',
    category: 'Free / Public Selection',
    description:
      'Replica streetcars connecting Little Rock and North Little Rock downtown grids over the Arkansas River',
    fare: 'Free',
  },
  {
    id: 'lr-transit-002',
    name: 'Rock Region METRO Express',
    category: 'Flash Rapid Selection',
    description: 'High-frequency commuter links connecting central urban hubs',
    fare: 'See route schedule',
  },
];

const sportsTeams: LRSportsTeam[] = [
  {
    id: 'lr-sports-001',
    name: 'Arkansas Travelers',
    description: 'Double-A affiliate Minor League Baseball',
    venue: 'Dickey-Stephens Park',
    ticketUrl: 'https://www.milb.com/arkansas/tickets',
    showLiveScore: true,
  },
  {
    id: 'lr-sports-002',
    name: 'Little Rock Trojans Basketball',
    description: 'UALR Trojans NCAA Division I Basketball',
    venue: 'Jack Stephens Center',
    ticketUrl: null,
    showLiveScore: true,
  },
];

const trails: LRTrail[] = [
  {
    id: 'lr-trail-001',
    name: 'Pinnacle Mountain State Park',
    tab: 'Top Trails',
    caption:
      'Rugged West Summit trail scrambling up exposed boulders to a 360-degree river valley panoramic view.',
    mapsQuery: 'Pinnacle Mountain State Park Little Rock AR',
  },
  {
    id: 'lr-trail-002',
    name: 'Riverfront Park and Junction Bridge',
    tab: 'Best Trails for Views',
    caption:
      'Sunset walks along illuminated iron bridges spanning historic rock formations over the Arkansas River.',
    mapsQuery: 'Riverfront Park Little Rock AR',
  },
];

// ─── EXPORT ───────────────────────────────────────────────────

export const littleRockData = {
  restaurants,
  transitOptions,
  sportsTeams,
  trails,
} as const;
