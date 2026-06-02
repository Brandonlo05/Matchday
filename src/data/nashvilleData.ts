// ============================================================
// MatchDay — Nashville City Intelligence Data
// ============================================================

import type { ProfileMatchTag } from './littleRockData';

// ─── INTERFACES ───────────────────────────────────────────────

export interface NashHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface NashDeals {
  hasLunchSpecial: boolean;
  lunchHours: string | null;
  lunchDeal: string | null;
  hasHappyHour: boolean;
  happyHourWindow: string | null;
  happyHourDeal: string | null;
  weeklySpecial: string | null;
}

export interface NashRestaurant {
  id: string;
  name: string;
  url: string;
  reservationUrl: string | null;
  address: string;
  neighborhood: string;
  priceRange: string;
  cuisine: string;
  description: string;
  mustOrderItem: string;
  profileMatchTags: ProfileMatchTag[];
  deals: NashDeals;
  historicalBadge: {
    active: boolean;
    copy: string | null;
  };
  instagramHandle: string;
  phoneNumber: string;
  hours: NashHours;
}

export interface NashTransitOption {
  id: string;
  name: string;
  category: 'Flash Rapid Selection' | 'Free / Public Selection';
  description: string;
  fare: string;
  frequency: string;
  keyRoute: string;
  appOrPaymentMethod: string;
  tip: string;
}

export interface NashUpcomingGame {
  opponent: string | null;
  date: string | null;
  time: string | null;
}

export interface NashSportsTeam {
  id: string;
  name: string;
  description: string;
  league: string;
  venue: string;
  venueAddress: string;
  ticketUrl: string | null;
  scheduleUrl: string;
  showLiveScore: boolean;
  upcomingGame: NashUpcomingGame;
}

export interface NashTrail {
  id: string;
  name: string;
  tab: 'Top Trails' | 'Best Trails for Views';
  caption: string;
  difficulty: string;
  distanceMiles: number;
  elevationGainFeet: number;
  bestTimeToVisit: string;
  mapsQuery: string;
  parkingAvailable: boolean;
  cost: string;
  tip: string;
}

export interface NashHistoricalPin {
  id: string;
  cityKey: string;
  lat: number;
  lng: number;
  title: string;
  body: string;
  era: string;
  category: string;
}

export interface NashFreeActivity {
  id: string;
  name: string;
  category: string;
  distance: string;
  description: string;
  tip: string;
  isFamilyFriendly: boolean;
  minAge: number;
  mapsQuery: string;
  hours: string;
  cost: string;
}

export interface NashvilleData {
  restaurants: NashRestaurant[];
  transitOptions: NashTransitOption[];
  sportsTeams: NashSportsTeam[];
  trails: NashTrail[];
  historicalPins: NashHistoricalPin[];
  freeActivities: NashFreeActivity[];
}

// ─── RESTAURANTS ─────────────────────────────────────────────

const restaurants: NashRestaurant[] = [
  {
    id: 'nashville-loveless-cafe',
    name: 'The Loveless Cafe',
    url: 'https://lovelesscafe.com',
    reservationUrl: null,
    address: '8400 Highway 100, Nashville, TN 37221',
    neighborhood: 'Bellevue',
    priceRange: '$$',
    cuisine: 'Southern Heritage',
    description:
      'An iconic Southern landmark serving scratch-made country classics on a historic stretch of Highway 100 since 1951. Famous for its welcoming down-home atmosphere and legendary country store.',
    mustOrderItem: 'Homemade Biscuits with Peach Preserves and Country Ham',
    profileMatchTags: ['Leisurely Flâneur', 'The Collective', 'The High-Energy Arena'],
    deals: {
      hasLunchSpecial: false,
      lunchHours: null,
      lunchDeal: null,
      hasHappyHour: false,
      happyHourWindow: null,
      happyHourDeal: null,
      weeklySpecial: 'Wednesday - All you can eat fried chicken (verify before launch)',
    },
    historicalBadge: {
      active: true,
      copy: 'Originally founded by Lon and Annie Loveless in 1951, this site grew from a modest front-porch table into an international destination that bakes 10,000 biscuits daily.',
    },
    instagramHandle: 'lovelesscafe',
    phoneNumber: '615-646-9700',
    hours: {
      monday: '8:00am - 9:00pm',
      tuesday: '8:00am - 9:00pm',
      wednesday: '8:00am - 9:00pm',
      thursday: '8:00am - 9:00pm',
      friday: '8:00am - 9:00pm',
      saturday: '7:00am - 9:00pm',
      sunday: '7:00am - 9:00pm',
    },
  },
  {
    id: 'nashville-princes-hot-chicken',
    name: "Prince's Hot Chicken Shack",
    url: 'https://www.princeshotchicken.com',
    reservationUrl: null,
    address: '5814 Nolensville Pike, Nashville, TN 37211',
    neighborhood: 'South Nashville',
    priceRange: '$$',
    cuisine: 'Hot Chicken',
    description:
      "The gold standard and undisputed pioneer of Nashville's signature culinary creation. Serving spicy, perfectly fried chicken to generations of locals since the mid-1930s.",
    mustOrderItem: 'Mild or Medium Quarter Bird with white bread and pickles',
    profileMatchTags: ['High-Velocity Explorer', 'The Decoder', 'Beer', 'Both'],
    deals: {
      hasLunchSpecial: true,
      lunchHours: '11:00am - 2:00pm Mon-Fri',
      lunchDeal: 'Two tenders, one side, and drink for twelve dollars',
      hasHappyHour: false,
      happyHourWindow: null,
      happyHourDeal: null,
      weeklySpecial: null,
    },
    historicalBadge: {
      active: true,
      copy: "Dating back nearly 90 years, Prince's is the original home of Nashville hot chicken, famously invented by Thornton Prince's partner.",
    },
    instagramHandle: 'princeshotchicken_official',
    phoneNumber: '615-226-9442',
    hours: {
      monday: '11:00am - 10:00pm',
      tuesday: '11:00am - 10:00pm',
      wednesday: '11:00am - 10:00pm',
      thursday: '11:00am - 10:00pm',
      friday: '11:00am - 11:00pm',
      saturday: '11:00am - 11:00pm',
      sunday: '12:00pm - 8:00pm',
    },
  },
  {
    id: 'nashville-browns-diner',
    name: "Brown's Diner",
    url: 'https://brownsdiner.com',
    reservationUrl: null,
    address: '2102 21st Ave S, Nashville, TN 37212',
    neighborhood: 'Hillsboro Village',
    priceRange: '$',
    cuisine: 'American Burgers',
    description:
      'Serving classic, flat-top grilled cheeseburgers from a historic trolley car since 1927. A beloved local dive that holds the oldest active beer license in the city.',
    mustOrderItem: 'Cheeseburger with a side of Hushpuppies',
    profileMatchTags: ['The Decoder', 'Solo Nomad', 'Beer'],
    deals: {
      hasLunchSpecial: false,
      lunchHours: null,
      lunchDeal: null,
      hasHappyHour: true,
      happyHourWindow: '4:00pm - 7:00pm Mon-Fri',
      happyHourDeal: 'Discounted domestic draft beers and simple well drinks',
      weeklySpecial: null,
    },
    historicalBadge: {
      active: true,
      copy: 'Housed in a converted 1927 trolley car, this diner remains a resilient symbol of old Nashville amid the rapid redevelopment of Hillsboro Village.',
    },
    instagramHandle: 'brownsdiner1927',
    phoneNumber: '615-269-5062',
    hours: {
      monday: '11:00am - 10:00pm',
      tuesday: '11:00am - 10:00pm',
      wednesday: '11:00am - 10:00pm',
      thursday: '11:00am - 10:00pm',
      friday: '11:00am - 11:00pm',
      saturday: '11:00am - 11:00pm',
      sunday: '12:00pm - 10:00pm',
    },
  },
  {
    id: 'nashville-midtown-cafe',
    name: 'Midtown Café',
    url: 'https://www.midtowncafe.com',
    reservationUrl: 'https://www.opentable.com/midtown-cafe',
    address: '102 19th Ave S, Nashville, TN 37203',
    neighborhood: 'Midtown',
    priceRange: '$$$',
    cuisine: 'Upscale American',
    description:
      'An intimate upscale venue offering pristine seafood, prime steaks, and an award-winning wine list since 1987. A favorite haunt for music industry executives looking for quiet, elegant dining.',
    mustOrderItem: 'Lemon Artichoke Soup',
    profileMatchTags: ['The Unwinder', 'The Romantic', 'The Low-Light Theater'],
    deals: {
      hasLunchSpecial: true,
      lunchHours: '11:00am - 2:00pm Mon-Fri',
      lunchDeal: 'Two-course express lunch featuring signature crab cakes or prime beef sliders',
      hasHappyHour: true,
      happyHourWindow: '4:30pm - 6:30pm Mon-Fri',
      happyHourDeal: 'Special pricing on select appetizers and premium tap wines',
      weeklySpecial: 'Wine Down Wednesdays - Selected bottles at half price',
    },
    historicalBadge: { active: false, copy: null },
    instagramHandle: 'midtown_cafe',
    phoneNumber: '615-320-7176',
    hours: {
      monday: '11:00am - 10:00pm',
      tuesday: '11:00am - 10:00pm',
      wednesday: '11:00am - 10:00pm',
      thursday: '11:00am - 10:00pm',
      friday: '11:00am - 11:00pm',
      saturday: '4:30pm - 11:00pm',
      sunday: '4:30pm - 10:00pm',
    },
  },
  {
    id: 'nashville-margot-cafe',
    name: 'Margot Café & Bar',
    url: 'https://www.margotcafe.com',
    reservationUrl: 'https://resy.com/cities/bna/margot-cafe-and-bar',
    address: '1017 Woodland St, Nashville, TN 37206',
    neighborhood: 'Five Points',
    priceRange: '$$$',
    cuisine: 'French-Italian Rustic',
    description:
      "A cozy neighborhood bistro created inside a converted 1930s service station. Features a daily rotating menu that emphasizes local, seasonal ingredients cooked with European rusticity.",
    mustOrderItem: 'House-cured Charcuterie Board',
    profileMatchTags: ['The Romantic', 'Leisurely Flâneur', 'The Low-Light Theater'],
    deals: {
      hasLunchSpecial: false,
      lunchHours: null,
      lunchDeal: null,
      hasHappyHour: false,
      happyHourWindow: null,
      happyHourDeal: null,
      weeklySpecial: 'Sunday Brunch - Rotating seasonal egg dishes and house pastries',
    },
    historicalBadge: {
      active: true,
      copy: 'Opened in 2001 by culinary pioneer Margot McCormack, this landmark bistro transformed the East Nashville dining scene from a 1930s service station into a culinary hub.',
    },
    instagramHandle: 'margotcafe',
    phoneNumber: '615-227-4668',
    hours: {
      monday: 'Closed',
      tuesday: '5:30pm - 10:00pm',
      wednesday: '5:30pm - 10:00pm',
      thursday: '5:30pm - 10:00pm',
      friday: '5:30pm - 11:00pm',
      saturday: '5:30pm - 11:00pm',
      sunday: '10:30am - 2:00pm',
    },
  },
  {
    id: 'nashville-merchants-restaurant',
    name: 'Merchants Restaurant',
    url: 'https://www.merchantsrestaurant.com',
    reservationUrl: 'https://www.opentable.com/merchants-restaurant',
    address: '401 Broadway, Nashville, TN 37203',
    neighborhood: 'Downtown',
    priceRange: '$$$',
    cuisine: 'American Bistro',
    description:
      'A lively restaurant situated in a three-story brick landmark that has operated since the late nineteenth century. Offers a vibrant downstairs bistro and a more formal, elegant upstairs dining room.',
    mustOrderItem: 'Merchants Double Cheeseburger on Brioche',
    profileMatchTags: ['The High-Energy Arena', 'The Collective', 'Beer', 'Both'],
    deals: {
      hasLunchSpecial: true,
      lunchHours: '11:00am - 3:00pm Daily',
      lunchDeal: 'Bistro sandwich and soup combos starting at fifteen dollars',
      hasHappyHour: true,
      happyHourWindow: '3:00pm - 6:00pm Mon-Thu',
      happyHourDeal: 'Select half-price draft beers and special pricing on house cocktails',
      weeklySpecial: null,
    },
    historicalBadge: {
      active: true,
      copy: 'Built in 1892 as a commercial hotel, this building hosted country legends Dolly Parton, Hank Williams, and Johnny Cash during early Grand Ole Opry radio broadcasts.',
    },
    instagramHandle: 'merchantsrestaurant',
    phoneNumber: '615-254-1892',
    hours: {
      monday: '11:00am - 10:00pm',
      tuesday: '11:00am - 10:00pm',
      wednesday: '11:00am - 10:00pm',
      thursday: '11:00am - 11:00pm',
      friday: '11:00am - 11:30pm',
      saturday: '11:00am - 11:30pm',
      sunday: '11:00am - 10:00pm',
    },
  },
  {
    id: 'nashville-san-antonio-taco-co',
    name: 'San Antonio Taco Company',
    url: 'http://www.sataco.com',
    reservationUrl: null,
    address: '2421 21st Ave S, Nashville, TN 37212',
    neighborhood: 'Midtown',
    priceRange: '$',
    cuisine: 'Tex-Mex',
    description:
      "The city's very first Tex-Mex spot, famous for its sprawling, lively wooden deck. Serves up fresh flour tortilla tacos alongside buckets of ice-cold beer to students and locals alike.",
    mustOrderItem: 'Fajita Beef Tacos with Signature Queso',
    profileMatchTags: ['High-Velocity Explorer', 'The Collective', 'Beer'],
    deals: {
      hasLunchSpecial: true,
      lunchHours: '11:00am - 2:00pm Mon-Fri',
      lunchDeal: 'Three taco basket with chips and salsa for nine dollars',
      hasHappyHour: true,
      happyHourWindow: '4:00pm - 7:00pm Daily',
      happyHourDeal: 'Discounts on buckets of domestic beers and draft pitchers',
      weeklySpecial: 'Taco Tuesdays - Discounted hard shell tacos all day',
    },
    historicalBadge: {
      active: true,
      copy: 'Established in 1984, this institution was the first to popularize the open-air patio concept in midtown Nashville.',
    },
    instagramHandle: 'sataconashville',
    phoneNumber: '615-269-4258',
    hours: {
      monday: '11:00am - 10:00pm',
      tuesday: '11:00am - 10:00pm',
      wednesday: '11:00am - 10:00pm',
      thursday: '11:00am - 11:00pm',
      friday: '11:00am - 11:00pm',
      saturday: '11:00am - 11:00pm',
      sunday: '11:00am - 10:00pm',
    },
  },
  {
    id: 'nashville-capitol-grille',
    name: 'Capitol Grille',
    url: 'https://www.capitolgrillenashville.com/home/',
    reservationUrl: 'https://www.opentable.com/capitol-grille',
    address: '231 6th Ave N, Nashville, TN 37219',
    neighborhood: 'Downtown',
    priceRange: '$$$$',
    cuisine: 'Southern Heritage',
    description:
      'An elegant dining room inside the historic Hermitage Hotel, serving upscale Southern recipes since 1910. Features beef and farm-to-table produce cultivated on the historic Glen Leven Farm.',
    mustOrderItem: 'Dry-Aged Tennessee Ribeye',
    profileMatchTags: ['The Romantic', 'The Low-Light Theater', 'Leisurely Flâneur'],
    deals: {
      hasLunchSpecial: false,
      lunchHours: null,
      lunchDeal: null,
      hasHappyHour: true,
      happyHourWindow: '4:00pm - 6:00pm Mon-Fri',
      happyHourDeal: 'Select discounts on curated bourbon flights in the adjacent Oak Bar',
      weeklySpecial: null,
    },
    historicalBadge: {
      active: true,
      copy: 'As the oldest continuously operating Southern restaurant in Tennessee, it has hosted numerous U.S. Presidents and historical delegates since 1910.',
    },
    instagramHandle: 'hermitagehotel',
    phoneNumber: '615-345-7116',
    hours: {
      monday: '7:00am - 10:00pm',
      tuesday: '7:00am - 10:00pm',
      wednesday: '7:00am - 10:00pm',
      thursday: '7:00am - 10:00pm',
      friday: '7:00am - 11:00pm',
      saturday: '7:00am - 11:00pm',
      sunday: '7:00am - 10:00pm',
    },
  },
];

// ─── TRANSIT OPTIONS ─────────────────────────────────────────

const transitOptions: NashTransitOption[] = [
  {
    id: 'nashville-transit-wego',
    name: 'WeGo Public Transit Bus',
    category: 'Free / Public Selection',
    description:
      'Nashville\'s primary public bus network connecting downtown with outlying neighborhoods and entertainment districts. Routes cover Broadway, Music Row, and Vanderbilt University.',
    fare: '$2.00 per ride',
    frequency: 'Every 15-30 minutes depending on route',
    keyRoute: 'Route 3 — Charlotte Pike to Downtown Transit Center',
    appOrPaymentMethod: 'WeGo Transit App or exact cash onboard',
    tip: 'The Music City Circuit downtown loop bus is completely free and connects Bridgestone Arena to the Gulch in under 10 minutes.',
  },
  {
    id: 'nashville-transit-circuit',
    name: 'Music City Circuit',
    category: 'Free / Public Selection',
    description:
      'A free downtown circulator bus running three color-coded loops connecting major attractions including Lower Broadway, the Gulch, SoBro, and the convention center district.',
    fare: 'Free',
    frequency: 'Every 10-15 minutes',
    keyRoute: 'Blue Circuit — Union Station to Nissan Stadium via Broadway',
    appOrPaymentMethod: 'No payment required — board at any marked stop',
    tip: 'The Green Circuit is the fastest way between the Gulch and 5th and Broadway without dealing with Lower Broadway traffic on weekend nights.',
  },
  {
    id: 'nashville-transit-lyft',
    name: 'Lyft and Uber Rideshare',
    category: 'Flash Rapid Selection',
    description:
      'Widely available throughout Metro Nashville with surge pricing common on weekend nights on Lower Broadway. Both services operate from Nashville International Airport with designated pickup zones on the ground floor.',
    fare: '$8-$18 average for downtown trips. $25-$40 from BNA airport',
    frequency: 'On-demand, typically 3-8 minute wait downtown',
    keyRoute: 'BNA Airport to Downtown — approximately 15 minutes via I-40 W',
    appOrPaymentMethod: 'Lyft or Uber app with credit card on file',
    tip: 'Avoid requesting rides directly on Broadway between 9 PM and 2 AM on weekends — walk one block to 4th or 5th Avenue to cut surge pricing significantly.',
  },
  {
    id: 'nashville-transit-bcycle',
    name: 'Nashville B-cycle Bike Share',
    category: 'Flash Rapid Selection',
    description:
      'Nashville\'s docked bike-sharing system with over 30 stations concentrated in downtown, Midtown, East Nashville, and Germantown. Standard pedal bikes and e-assist bikes available.',
    fare: '$1 to unlock plus $0.15 per minute. $15 day pass for unlimited 60-minute rides',
    frequency: 'Bikes available 24/7 at docking stations',
    keyRoute: 'Riverfront Park Station to Germantown via the Cumberland River Greenway',
    appOrPaymentMethod: 'B-cycle app or credit card at any kiosk',
    tip: 'The Cumberland River Greenway is a dedicated multi-use path — cycling from Shelby Bottoms to downtown is scenic, flat, and completely car-free for most of the route.',
  },
];

// ─── SPORTS TEAMS ────────────────────────────────────────────

const sportsTeams: NashSportsTeam[] = [
  {
    id: 'nashville-sports-predators',
    name: 'Nashville Predators',
    description: 'NHL — Bridgestone Arena, downtown Nashville',
    league: 'NHL',
    venue: 'Bridgestone Arena',
    venueAddress: '501 Broadway, Nashville, TN 37203',
    ticketUrl: 'https://www.nhl.com/predators/tickets',
    scheduleUrl: 'https://www.nhl.com/predators/schedule',
    showLiveScore: true,
    upcomingGame: { opponent: null, date: null, time: null },
  },
  {
    id: 'nashville-sports-titans',
    name: 'Tennessee Titans',
    description: 'NFL — Nissan Stadium, East Bank Nashville',
    league: 'NFL',
    venue: 'Nissan Stadium',
    venueAddress: '1 Titans Way, Nashville, TN 37213',
    ticketUrl: 'https://www.tennesseetitans.com/tickets',
    scheduleUrl: 'https://www.tennesseetitans.com/schedule',
    showLiveScore: true,
    upcomingGame: { opponent: null, date: null, time: null },
  },
  {
    id: 'nashville-sports-nashvillesc',
    name: 'Nashville SC',
    description: 'MLS — GEODIS Park, Nashville',
    league: 'MLS',
    venue: 'GEODIS Park',
    venueAddress: '501 Benton Ave, Nashville, TN 37203',
    ticketUrl: 'https://www.nashvillesc.com/tickets',
    scheduleUrl: 'https://www.nashvillesc.com/schedule',
    showLiveScore: true,
    upcomingGame: { opponent: null, date: null, time: null },
  },
  {
    id: 'nashville-sports-sounds',
    name: 'Nashville Sounds',
    description: 'Triple-A Minor League Baseball — First Horizon Park',
    league: 'AAA Minor League Baseball',
    venue: 'First Horizon Park',
    venueAddress: '19 Junior Gilliam Way, Nashville, TN 37219',
    ticketUrl: 'https://www.milb.com/nashville/tickets',
    scheduleUrl: 'https://www.milb.com/nashville/schedule',
    showLiveScore: true,
    upcomingGame: { opponent: null, date: null, time: null },
  },
];

// ─── TRAILS ──────────────────────────────────────────────────

const trails: NashTrail[] = [
  {
    id: 'nashville-trail-percy-warner',
    name: 'Percy Warner Park Deep Well Trail',
    tab: 'Top Trails',
    caption:
      'A rugged, hilly trail threading through 3,000 acres of hardwood forest with dramatic stone staircase descents. Features spectacular overlooking vistas of the rolling Tennessee hills at multiple summit points.',
    difficulty: 'Moderate',
    distanceMiles: 4.5,
    elevationGainFeet: 550,
    bestTimeToVisit: 'Autumn Mornings',
    mapsQuery: 'Percy Warner Park Deep Well Trailhead Nashville TN',
    parkingAvailable: true,
    cost: 'Free',
    tip: 'The trail contains steep stone stairs built by the CCC in the 1930s — wear shoes with solid grip.',
  },
  {
    id: 'nashville-trail-radnor-lake',
    name: 'Radnor Lake South Lake Trail',
    tab: 'Top Trails',
    caption:
      "A pristine 2.6-mile loop hugging the shoreline of an 85-acre protected lake inside Nashville's most beloved natural area. White-tailed deer graze openly along the water's edge at dawn and great blue herons stalk the shallows year-round.",
    difficulty: 'Easy',
    distanceMiles: 2.6,
    elevationGainFeet: 120,
    bestTimeToVisit: 'Early Morning',
    mapsQuery: 'Radnor Lake State Park South Lake Trail Nashville TN',
    parkingAvailable: true,
    cost: 'Free',
    tip: 'Parking fills by 8 AM on weekends. Arrive before sunrise to catch mist rising off the lake and guaranteed deer sightings along the north bank.',
  },
  {
    id: 'nashville-trail-cumberland-greenway',
    name: 'Cumberland River Greenway',
    tab: 'Top Trails',
    caption:
      'A 6.5-mile paved multi-use trail tracing the eastern bank of the Cumberland River from Shelby Bottoms Nature Center through East Nashville to the Gateway Bridge. The downtown skyline reflected in the river at sunset is one of Nashville\'s finest views.',
    difficulty: 'Easy',
    distanceMiles: 6.5,
    elevationGainFeet: 45,
    bestTimeToVisit: 'Sunset',
    mapsQuery: 'Cumberland River Greenway Shelby Bottoms Nashville TN',
    parkingAvailable: true,
    cost: 'Free',
    tip: 'The stretch between the Pedestrian Bridge and Shelby Bottoms is the most scenic — park at Two Rivers Park for the widest trailhead access and fewest crowds.',
  },
  {
    id: 'nashville-trail-long-hunter',
    name: 'Long Hunter State Park Volunteer Trail',
    tab: 'Best Trails for Views',
    caption:
      'A 5-mile loop along the eastern shoreline of J. Percy Priest Lake offering sweeping open-water views across 14,200 acres of reservoir. Cedar bluffs drop directly to the lake and limestone outcroppings provide natural overlooks with unobstructed 180-degree panoramas.',
    difficulty: 'Moderate',
    distanceMiles: 5.0,
    elevationGainFeet: 310,
    bestTimeToVisit: 'Late Afternoon',
    mapsQuery: 'Long Hunter State Park Volunteer Trail Nashville TN',
    parkingAvailable: true,
    cost: 'Free',
    tip: 'The Bryant Grove area trailhead has the best lake access — bring a swimsuit in summer because the rocky shoreline makes excellent swimming between miles 2 and 3.',
  },
  {
    id: 'nashville-trail-bells-bend',
    name: 'Bells Bend Outdoor Center Loop',
    tab: 'Best Trails for Views',
    caption:
      "A 3.2-mile loop through one of Nashville's last remaining agricultural floodplains offering panoramic views of the Cumberland River oxbow bend. Wildflower meadows bloom from April through June and the ridge overlook delivers an unobstructed view of the river curve unlike anywhere else in the city.",
    difficulty: 'Easy',
    distanceMiles: 3.2,
    elevationGainFeet: 180,
    bestTimeToVisit: 'Spring Mornings',
    mapsQuery: 'Bells Bend Outdoor Center Nashville TN',
    parkingAvailable: true,
    cost: 'Free',
    tip: "This park is rarely crowded even on weekends — Nashville's best-kept secret for birding. Bring binoculars for the ridge section where hawks soar the thermals above the river bend.",
  },
];

// ─── HISTORICAL PINS ─────────────────────────────────────────

const historicalPins: NashHistoricalPin[] = [
  {
    id: 'nashville-pin-ryman',
    cityKey: 'nashville',
    lat: 36.161278,
    lng: -86.778500,
    title: 'Birthplace of Bluegrass',
    body: "On December 8, 1945, Earl Scruggs stepped onto this stage with his five-string banjo, cementing the definitive bluegrass sound for a crowd of over 2,000 patrons. The yellow pine pews beneath these arched windows have reverberated with Hank Williams, Johnny Cash, and Patsy Cline since its 1892 opening.",
    era: 'Late 20th Century',
    category: 'Music History',
  },
  {
    id: 'nashville-pin-fort-negley',
    cityKey: 'nashville',
    lat: 36.139472,
    lng: -86.785611,
    title: 'The Fortress Built by Forced Labor',
    body: "Between August and November 1862, an estimated 2,768 workers — the majority of them enslaved and free Black laborers — quarried and stacked 640,000 cubic feet of limestone to construct the largest inland masonry fort in North America. When Confederate General Hood's army of 23,000 soldiers bypassed it entirely on December 15, 1864, Fort Negley never fired a single shot.",
    era: 'Civil War',
    category: 'Civil War',
  },
  {
    id: 'nashville-pin-fisk',
    cityKey: 'nashville',
    lat: 36.167389,
    lng: -86.803167,
    title: 'Nine Students Save a University',
    body: "On October 6, 1871, nine formerly enslaved students departed this campus with $40 in cash and performed Negro spirituals before Queen Victoria at St. James's Palace, raising $150,000 — enough to purchase the 25-acre campus that became Fisk University. The funds were earned by performing songs that had been sung in secret on plantations across the South.",
    era: 'Reconstruction Era',
    category: 'Civil Rights',
  },
  {
    id: 'nashville-pin-hermitage',
    cityKey: 'nashville',
    lat: 36.218972,
    lng: -86.611583,
    title: "Old Hickory's Final Acres",
    body: "Andrew Jackson purchased 640 acres of this Cumberland River bottomland in 1804 for $3,400, expanded the property to 1,050 acres, and enslaved 150 people to work the cotton fields at peak production. He died in the southeast bedroom on June 8, 1845, at age 78, reportedly whispering to his assembled household, 'I hope to meet you all in heaven.'",
    era: 'Antebellum',
    category: 'Political',
  },
  {
    id: 'nashville-pin-studio-b',
    cityKey: 'nashville',
    lat: 36.148694,
    lng: -86.795528,
    title: 'The Room Where Country Was Built',
    body: "Between 1957 and 1977, RCA Studio B recorded over 35,000 individual song sessions, and Elvis Presley recorded 'Are You Lonesome Tonight?' here on April 4, 1960, in a single take. The studio's distinctive echo — engineered using the room's natural 1.8-second reverb — defined the Nashville Sound and sold over 100 million records worldwide.",
    era: 'Mid-20th Century',
    category: 'Music History',
  },
  {
    id: 'nashville-pin-sit-in',
    cityKey: 'nashville',
    lat: 36.165361,
    lng: -86.782472,
    title: 'The Lunch Counter That Changed the Law',
    body: "On February 13, 1960, 124 Black students from Fisk University, Tennessee A&I, and American Baptist College sat at the lunch counters of Woolworth's, Kress, and McClellan's on 5th Avenue North. After 81 days of nonviolent sit-ins, Mayor Ben West became the first Southern mayor to publicly declare racial segregation of lunch counters morally wrong on April 19, 1960.",
    era: 'Civil Rights Era',
    category: 'Civil Rights',
  },
  {
    id: 'nashville-pin-union-station',
    cityKey: 'nashville',
    lat: 36.151472,
    lng: -86.786389,
    title: 'The Station That Moved a Nation',
    body: "Completed in 1900 at a cost of $1.5 million, Union Station processed 3.8 million passengers annually at its peak during World War II when troop trains departed its 14 tracks every 47 minutes. The original barrel-vaulted ceiling with 27 individual stained glass panels survived the station's abandonment and two-decade closure intact.",
    era: 'Industrial Era',
    category: 'Architecture',
  },
  {
    id: 'nashville-pin-WSM',
    cityKey: 'nashville',
    lat: 36.193056,
    lng: -86.750000,
    title: 'The Night the Grand Ole Opry Was Born',
    body: "On November 28, 1925, radio station WSM broadcast its first Barn Dance program with 78-year-old Uncle Jimmy Thompson playing fiddle, and within six weeks the audience response overwhelmed the station with 5,000 letters per week. Announcer George D. Hay renamed it the Grand Ole Opry on December 10, 1927, saying: 'We will present the Grand Ole Opry.'",
    era: 'Early 20th Century',
    category: 'Music History',
  },
  {
    id: 'nashville-pin-maxwell-house',
    cityKey: 'nashville',
    lat: 36.163944,
    lng: -86.777917,
    title: 'Where Presidents Drank Their Coffee',
    body: "President Theodore Roosevelt, visiting Nashville in 1907 for a Confederate veterans reunion, reportedly drained his after-dinner cup and declared the Maxwell House Hotel's coffee 'good to the last drop' — a phrase the Maxwell House Coffee company adopted as its permanent slogan. That slogan has been printed on over 4 billion coffee cans since.",
    era: 'Gilded Age',
    category: 'Cultural',
  },
  {
    id: 'nashville-pin-parthenon',
    cityKey: 'nashville',
    lat: 36.149667,
    lng: -86.814972,
    title: 'Athens of the South, Literally',
    body: "Built as a temporary plaster structure for Tennessee's 1897 Centennial Exposition, Nashville's full-scale Parthenon replica was so beloved that the city rebuilt it permanently in concrete between 1920 and 1931 at a cost of $932,000. In 1990 sculptor Alan LeQuire completed a 41-foot-10-inch gilded statue of Athena — the tallest indoor sculpture in the Western Hemisphere.",
    era: 'Gilded Age',
    category: 'Architecture',
  },
];

// ─── FREE ACTIVITIES ─────────────────────────────────────────

const freeActivities: NashFreeActivity[] = [
  {
    id: 'nashville-free-parthenon',
    name: 'The Parthenon at Centennial Park',
    category: 'landmark',
    distance: '1.8 miles from downtown',
    description:
      'A full-scale replica of the ancient Greek Parthenon housing a 42-foot gilded statue of Athena. Surrounded by beautiful park grounds alongside Lake Watauga.',
    tip: 'The exterior is free to view anytime — the interior museum charges a small fee but the outside is spectacular at golden hour.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'The Parthenon Centennial Park Nashville TN',
    hours: 'Always open exterior',
    cost: 'Free exterior',
  },
  {
    id: 'nashville-free-pedestrian-bridge',
    name: 'John Seigenthaler Pedestrian Bridge',
    category: 'landmark',
    distance: '0.4 miles from downtown',
    description:
      "A 3,150-foot converted railroad bridge spanning the Cumberland River offering the finest unobstructed views of the Nashville skyline available from any point in the city. Connects SoBro to East Nashville and is a favorite for sunset walks and skyline photography.",
    tip: 'Walk to the midpoint of the bridge at blue hour — roughly 30 minutes after sunset — for perfectly balanced skyline lighting without harsh shadows.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'John Seigenthaler Pedestrian Bridge Nashville TN',
    hours: 'Always open',
    cost: 'Free',
  },
  {
    id: 'nashville-free-honky-tonk',
    name: 'Lower Broadway Honky Tonk Strip',
    category: 'event',
    distance: 'Downtown',
    description:
      'A 5-block stretch of neon-lit honky-tonk bars where live country music plays free across multiple floors simultaneously from 10 AM through 3 AM daily. Artists performing here are unsigned or emerging and tickets cost nothing.',
    tip: "Tootsie's Orchid Lounge, Layla's, and The Stage have the most authentic lineups. Avoid the celebrity-branded bars which charge covers and play recorded music.",
    isFamilyFriendly: false,
    minAge: 21,
    mapsQuery: 'Lower Broadway Honky Tonk Nashville TN',
    hours: '10:00 AM - 3:00 AM daily',
    cost: 'Free entry',
  },
  {
    id: 'nashville-free-country-music-hall',
    name: 'Country Music Hall of Fame Plaza and Public Murals',
    category: 'landmark',
    distance: '0.2 miles from Broadway',
    description:
      "The exterior plaza and surrounding SoBro neighborhood feature over a dozen large-scale public murals depicting Nashville's musical history. The Hall of Fame interior charges admission but the outdoor experience is entirely free.",
    tip: 'The Wings mural on 2nd Avenue is the most photographed but the lesser-known Music City mosaic on Demonbreun Street is more artistically significant and rarely has a line.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Country Music Hall of Fame plaza murals Nashville TN',
    hours: 'Always accessible outdoors',
    cost: 'Free',
  },
  {
    id: 'nashville-free-shelby-bottoms',
    name: 'Shelby Bottoms Greenway and Nature Center',
    category: 'trail',
    distance: '2.1 miles from downtown',
    description:
      'A 1,000-acre riverside nature preserve with 10 miles of interconnected trails through bottomland hardwood forest, wetland meadows, and Cumberland River shoreline. The Nature Center hosts free naturalist programs on weekends.',
    tip: 'The river access point at the end of the Boscobel Street trailhead is a local swimming hole in summer — completely free, rarely crowded on weekdays, and surrounded by old-growth sycamores.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Shelby Bottoms Greenway Nature Center Nashville TN',
    hours: 'Dawn to dusk daily',
    cost: 'Free',
  },
  {
    id: 'nashville-free-bicentennial-mall',
    name: 'Bicentennial Capitol Mall State Park',
    category: 'landmark',
    distance: '0.5 miles from downtown',
    description:
      'A 19-acre outdoor history museum stretching north from the State Capitol featuring a 200-foot granite map of Tennessee, a World War II memorial court, and a 95-bell carillon that plays on the hour. Entirely free and dramatically undervisited.',
    tip: 'Stand at the granite Tennessee map at high noon on a clear day — the directional shadow lines are calibrated to point true north across the state.',
    isFamilyFriendly: true,
    minAge: 0,
    mapsQuery: 'Bicentennial Capitol Mall State Park Nashville TN',
    hours: 'Always open',
    cost: 'Free',
  },
];

// ─── EXPORT ───────────────────────────────────────────────────

export const nashvilleData: NashvilleData = {
  restaurants,
  transitOptions,
  sportsTeams,
  trails,
  historicalPins,
  freeActivities,
};
