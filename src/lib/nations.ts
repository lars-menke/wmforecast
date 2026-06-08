import type { TeamStats } from './poisson';

export type Nation = {
  code: string;
  name: string;
  shortName: string;
  flag: string;
  color: string;
  textOnColor: 'light' | 'dark';
};

export const NATIONS: Record<string, Nation> = {
  // Nordamerika (Gastgeber)
  USA: { code: 'USA', name: 'USA',           shortName: 'USA', flag: '🇺🇸', color: '#002868', textOnColor: 'light' },
  MEX: { code: 'MEX', name: 'Mexiko',        shortName: 'MEX', flag: '🇲🇽', color: '#006847', textOnColor: 'light' },
  CAN: { code: 'CAN', name: 'Kanada',        shortName: 'KAN', flag: '🇨🇦', color: '#FF0000', textOnColor: 'light' },
  // CONCACAF
  JAM: { code: 'JAM', name: 'Jamaika',       shortName: 'JAM', flag: '🇯🇲', color: '#000000', textOnColor: 'light' },
  HON: { code: 'HON', name: 'Honduras',      shortName: 'HON', flag: '🇭🇳', color: '#0073CF', textOnColor: 'light' },
  PAN: { code: 'PAN', name: 'Panama',        shortName: 'PAN', flag: '🇵🇦', color: '#005293', textOnColor: 'light' },
  // CONMEBOL
  ARG: { code: 'ARG', name: 'Argentinien',   shortName: 'ARG', flag: '🇦🇷', color: '#74ACDF', textOnColor: 'dark'  },
  BRA: { code: 'BRA', name: 'Brasilien',     shortName: 'BRA', flag: '🇧🇷', color: '#009C3B', textOnColor: 'light' },
  URU: { code: 'URU', name: 'Uruguay',       shortName: 'URU', flag: '🇺🇾', color: '#5EB6E4', textOnColor: 'dark'  },
  COL: { code: 'COL', name: 'Kolumbien',     shortName: 'KOL', flag: '🇨🇴', color: '#FCD116', textOnColor: 'dark'  },
  ECU: { code: 'ECU', name: 'Ecuador',       shortName: 'ECU', flag: '🇪🇨', color: '#FFD100', textOnColor: 'dark'  },
  VEN: { code: 'VEN', name: 'Venezuela',     shortName: 'VEN', flag: '🇻🇪', color: '#CF142B', textOnColor: 'light' },
  PAR: { code: 'PAR', name: 'Paraguay',      shortName: 'PAR', flag: '🇵🇾', color: '#D52B1E', textOnColor: 'light' },
  // UEFA
  GER: { code: 'GER', name: 'Deutschland',   shortName: 'DFB', flag: '🇩🇪', color: '#000000', textOnColor: 'light' },
  FRA: { code: 'FRA', name: 'Frankreich',    shortName: 'FRA', flag: '🇫🇷', color: '#002395', textOnColor: 'light' },
  ESP: { code: 'ESP', name: 'Spanien',       shortName: 'ESP', flag: '🇪🇸', color: '#AA151B', textOnColor: 'light' },
  ENG: { code: 'ENG', name: 'England',       shortName: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#FFFFFF', textOnColor: 'dark'  },
  POR: { code: 'POR', name: 'Portugal',      shortName: 'POR', flag: '🇵🇹', color: '#006600', textOnColor: 'light' },
  NED: { code: 'NED', name: 'Niederlande',   shortName: 'NED', flag: '🇳🇱', color: '#FF6600', textOnColor: 'light' },
  BEL: { code: 'BEL', name: 'Belgien',       shortName: 'BEL', flag: '🇧🇪', color: '#ED2939', textOnColor: 'light' },
  AUT: { code: 'AUT', name: 'Oesterreich',   shortName: 'AUT', flag: '🇦🇹', color: '#ED2939', textOnColor: 'light' },
  SUI: { code: 'SUI', name: 'Schweiz',       shortName: 'SUI', flag: '🇨🇭', color: '#FF0000', textOnColor: 'light' },
  CRO: { code: 'CRO', name: 'Kroatien',      shortName: 'KRO', flag: '🇭🇷', color: '#FF0000', textOnColor: 'light' },
  SRB: { code: 'SRB', name: 'Serbien',       shortName: 'SRB', flag: '🇷🇸', color: '#C6363C', textOnColor: 'light' },
  SCO: { code: 'SCO', name: 'Schottland',    shortName: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#003DA5', textOnColor: 'light' },
  DEN: { code: 'DEN', name: 'Daenemark',     shortName: 'DEN', flag: '🇩🇰', color: '#C60C30', textOnColor: 'light' },
  TUR: { code: 'TUR', name: 'Tuerkei',       shortName: 'TUR', flag: '🇹🇷', color: '#E30A17', textOnColor: 'light' },
  POL: { code: 'POL', name: 'Polen',         shortName: 'POL', flag: '🇵🇱', color: '#DC143C', textOnColor: 'light' },
  SVN: { code: 'SVN', name: 'Slowenien',     shortName: 'SVN', flag: '🇸🇮', color: '#003DA5', textOnColor: 'light' },
  UKR: { code: 'UKR', name: 'Ukraine',       shortName: 'UKR', flag: '🇺🇦', color: '#005BBB', textOnColor: 'light' },
  // AFC
  JPN: { code: 'JPN', name: 'Japan',         shortName: 'JPN', flag: '🇯🇵', color: '#BC002D', textOnColor: 'light' },
  KOR: { code: 'KOR', name: 'Suedkorea',     shortName: 'KOR', flag: '🇰🇷', color: '#003478', textOnColor: 'light' },
  IRN: { code: 'IRN', name: 'Iran',          shortName: 'IRN', flag: '🇮🇷', color: '#239F40', textOnColor: 'light' },
  AUS: { code: 'AUS', name: 'Australien',    shortName: 'AUS', flag: '🇦🇺', color: '#FFD700', textOnColor: 'dark'  },
  SAU: { code: 'SAU', name: 'Saudi-Arabien', shortName: 'SAU', flag: '🇸🇦', color: '#006C35', textOnColor: 'light' },
  QAT: { code: 'QAT', name: 'Katar',         shortName: 'QAT', flag: '🇶🇦', color: '#8D1B3D', textOnColor: 'light' },
  IRQ: { code: 'IRQ', name: 'Irak',          shortName: 'IRQ', flag: '🇮🇶', color: '#007A3D', textOnColor: 'light' },
  JOR: { code: 'JOR', name: 'Jordanien',     shortName: 'JOR', flag: '🇯🇴', color: '#007A3D', textOnColor: 'light' },
  // CAF
  MAR: { code: 'MAR', name: 'Marokko',       shortName: 'MAR', flag: '🇲🇦', color: '#C1272D', textOnColor: 'light' },
  SEN: { code: 'SEN', name: 'Senegal',       shortName: 'SEN', flag: '🇸🇳', color: '#00853F', textOnColor: 'light' },
  EGY: { code: 'EGY', name: 'Aegypten',      shortName: 'EGY', flag: '🇪🇬', color: '#CE1126', textOnColor: 'light' },
  NGA: { code: 'NGA', name: 'Nigeria',       shortName: 'NGA', flag: '🇳🇬', color: '#008751', textOnColor: 'light' },
  CIV: { code: 'CIV', name: 'Elfenbeinkueste', shortName: 'CIV', flag: '🇨🇮', color: '#F77F00', textOnColor: 'light' },
  GHA: { code: 'GHA', name: 'Ghana',         shortName: 'GHA', flag: '🇬🇭', color: '#006B3F', textOnColor: 'light' },
  CMR: { code: 'CMR', name: 'Kamerun',       shortName: 'CMR', flag: '🇨🇲', color: '#007A5E', textOnColor: 'light' },
  TUN: { code: 'TUN', name: 'Tunesien',      shortName: 'TUN', flag: '🇹🇳', color: '#E70013', textOnColor: 'light' },
  RSA: { code: 'RSA', name: 'Suedafrika',    shortName: 'RSA', flag: '🇿🇦', color: '#007A4D', textOnColor: 'light' },
  // OFC
  NZL: { code: 'NZL', name: 'Neuseeland',    shortName: 'NZL', flag: '🇳🇿', color: '#00247D', textOnColor: 'light' },
  // Weitere UEFA
  CZE: { code: 'CZE', name: 'Tschechien',    shortName: 'CZE', flag: '🇨🇿', color: '#D7141A', textOnColor: 'light' },
  BIH: { code: 'BIH', name: 'Bosnien-Herzegowina', shortName: 'BIH', flag: '🇧🇦', color: '#002395', textOnColor: 'light' },
  SWE: { code: 'SWE', name: 'Schweden',      shortName: 'SWE', flag: '🇸🇪', color: '#006AA7', textOnColor: 'light' },
  NOR: { code: 'NOR', name: 'Norwegen',      shortName: 'NOR', flag: '🇳🇴', color: '#EF2B2D', textOnColor: 'light' },
  // Weitere CAF
  ALG: { code: 'ALG', name: 'Algerien',      shortName: 'ALG', flag: '🇩🇿', color: '#006233', textOnColor: 'light' },
  CPV: { code: 'CPV', name: 'Kap Verde',     shortName: 'CPV', flag: '🇨🇻', color: '#003893', textOnColor: 'light' },
  COD: { code: 'COD', name: 'DR Kongo',      shortName: 'COD', flag: '🇨🇩', color: '#007FFF', textOnColor: 'light' },
  // Weitere AFC
  UZB: { code: 'UZB', name: 'Usbekistan',    shortName: 'UZB', flag: '🇺🇿', color: '#1EB53A', textOnColor: 'light' },
  // Weitere CONCACAF
  HAI: { code: 'HAI', name: 'Haiti',         shortName: 'HAI', flag: '🇭🇹', color: '#00209F', textOnColor: 'light' },
  CUW: { code: 'CUW', name: 'Curacao',       shortName: 'CUW', flag: '🇨🇼', color: '#002B7F', textOnColor: 'light' },
};

// Historische Laenderspiel-Statistiken (neutral, hGF = aGF, hGA = aGA)
// Basierend auf Länderspielen 2023-2026, gewichtet nach Aktualitat
// rank: FIFA-Weltrangliste (ungefaehr, Stand Qualifikationsbeginn)
export const NATION_STATS: Record<string, TeamStats> = {
  // Titelkandidaten
  ARG: { rank:  1, hGF: 2.10, hGA: 0.65, aGF: 2.10, aGA: 0.65 },
  FRA: { rank:  2, hGF: 1.90, hGA: 0.70, aGF: 1.90, aGA: 0.70 },
  ENG: { rank:  3, hGF: 1.85, hGA: 0.70, aGF: 1.85, aGA: 0.70 },
  ESP: { rank:  4, hGF: 1.90, hGA: 0.65, aGF: 1.90, aGA: 0.65 },
  BRA: { rank:  5, hGF: 1.80, hGA: 0.80, aGF: 1.80, aGA: 0.80 },
  POR: { rank:  6, hGF: 1.90, hGA: 0.90, aGF: 1.90, aGA: 0.90 },
  NED: { rank:  7, hGF: 1.70, hGA: 0.90, aGF: 1.70, aGA: 0.90 },
  GER: { rank:  8, hGF: 1.70, hGA: 1.00, aGF: 1.70, aGA: 1.00 },
  URU: { rank:  9, hGF: 1.60, hGA: 0.80, aGF: 1.60, aGA: 0.80 },
  COL: { rank: 10, hGF: 1.60, hGA: 0.90, aGF: 1.60, aGA: 0.90 },
  BEL: { rank: 11, hGF: 1.60, hGA: 0.90, aGF: 1.60, aGA: 0.90 },
  USA: { rank: 12, hGF: 1.50, hGA: 1.00, aGF: 1.50, aGA: 1.00 },
  MEX: { rank: 13, hGF: 1.50, hGA: 1.00, aGF: 1.50, aGA: 1.00 },
  MAR: { rank: 14, hGF: 1.30, hGA: 0.70, aGF: 1.30, aGA: 0.70 },
  JPN: { rank: 15, hGF: 1.50, hGA: 0.90, aGF: 1.50, aGA: 0.90 },
  CAN: { rank: 16, hGF: 1.40, hGA: 1.00, aGF: 1.40, aGA: 1.00 },
  SEN: { rank: 17, hGF: 1.30, hGA: 0.90, aGF: 1.30, aGA: 0.90 },
  CRO: { rank: 18, hGF: 1.40, hGA: 0.95, aGF: 1.40, aGA: 0.95 },
  SUI: { rank: 19, hGF: 1.40, hGA: 1.00, aGF: 1.40, aGA: 1.00 },
  AUT: { rank: 20, hGF: 1.50, hGA: 1.10, aGF: 1.50, aGA: 1.10 },
  DEN: { rank: 21, hGF: 1.50, hGA: 0.90, aGF: 1.50, aGA: 0.90 },
  UKR: { rank: 22, hGF: 1.30, hGA: 1.00, aGF: 1.30, aGA: 1.00 },
  IRN: { rank: 23, hGF: 1.20, hGA: 1.00, aGF: 1.20, aGA: 1.00 },
  AUS: { rank: 24, hGF: 1.30, hGA: 1.00, aGF: 1.30, aGA: 1.00 },
  SRB: { rank: 25, hGF: 1.40, hGA: 1.10, aGF: 1.40, aGA: 1.10 },
  TUR: { rank: 26, hGF: 1.40, hGA: 1.10, aGF: 1.40, aGA: 1.10 },
  KOR: { rank: 27, hGF: 1.30, hGA: 1.10, aGF: 1.30, aGA: 1.10 },
  POL: { rank: 28, hGF: 1.30, hGA: 1.10, aGF: 1.30, aGA: 1.10 },
  ECU: { rank: 29, hGF: 1.20, hGA: 1.10, aGF: 1.20, aGA: 1.10 },
  SCO: { rank: 30, hGF: 1.30, hGA: 1.00, aGF: 1.30, aGA: 1.00 },
  SVN: { rank: 31, hGF: 1.20, hGA: 1.00, aGF: 1.20, aGA: 1.00 },
  CIV: { rank: 32, hGF: 1.20, hGA: 1.10, aGF: 1.20, aGA: 1.10 },
  SAU: { rank: 33, hGF: 1.10, hGA: 1.20, aGF: 1.10, aGA: 1.20 },
  NGA: { rank: 34, hGF: 1.20, hGA: 1.10, aGF: 1.20, aGA: 1.10 },
  EGY: { rank: 35, hGF: 1.20, hGA: 1.00, aGF: 1.20, aGA: 1.00 },
  PAR: { rank: 36, hGF: 1.10, hGA: 1.10, aGF: 1.10, aGA: 1.10 },
  CMR: { rank: 37, hGF: 1.00, hGA: 1.20, aGF: 1.00, aGA: 1.20 },
  GHA: { rank: 38, hGF: 1.10, hGA: 1.20, aGF: 1.10, aGA: 1.20 },
  TUN: { rank: 39, hGF: 1.00, hGA: 1.10, aGF: 1.00, aGA: 1.10 },
  VEN: { rank: 40, hGF: 1.10, hGA: 1.20, aGF: 1.10, aGA: 1.20 },
  PAN: { rank: 41, hGF: 0.90, hGA: 1.30, aGF: 0.90, aGA: 1.30 },
  IRQ: { rank: 42, hGF: 1.00, hGA: 1.20, aGF: 1.00, aGA: 1.20 },
  QAT: { rank: 43, hGF: 0.90, hGA: 1.30, aGF: 0.90, aGA: 1.30 },
  RSA: { rank: 44, hGF: 1.10, hGA: 1.30, aGF: 1.10, aGA: 1.30 },
  JAM: { rank: 45, hGF: 0.90, hGA: 1.40, aGF: 0.90, aGA: 1.40 },
  JOR: { rank: 46, hGF: 0.90, hGA: 1.30, aGF: 0.90, aGA: 1.30 },
  HON: { rank: 47, hGF: 0.80, hGA: 1.50, aGF: 0.80, aGA: 1.50 },
  NZL: { rank: 43, hGF: 0.80, hGA: 1.50, aGF: 0.80, aGA: 1.50 },
  CZE: { rank: 28, hGF: 1.35, hGA: 1.05, aGF: 1.35, aGA: 1.05 },
  BIH: { rank: 36, hGF: 1.20, hGA: 1.15, aGF: 1.20, aGA: 1.15 },
  SWE: { rank: 25, hGF: 1.40, hGA: 1.00, aGF: 1.40, aGA: 1.00 },
  NOR: { rank: 27, hGF: 1.45, hGA: 1.00, aGF: 1.45, aGA: 1.00 },
  ALG: { rank: 35, hGF: 1.10, hGA: 1.10, aGF: 1.10, aGA: 1.10 },
  CPV: { rank: 46, hGF: 0.90, hGA: 1.30, aGF: 0.90, aGA: 1.30 },
  COD: { rank: 40, hGF: 1.00, hGA: 1.20, aGF: 1.00, aGA: 1.20 },
  UZB: { rank: 44, hGF: 0.95, hGA: 1.25, aGF: 0.95, aGA: 1.25 },
  HAI: { rank: 48, hGF: 0.80, hGA: 1.50, aGF: 0.80, aGA: 1.50 },
  CUW: { rank: 47, hGF: 0.85, hGA: 1.45, aGF: 0.85, aGA: 1.45 },
};
