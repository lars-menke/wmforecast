import type { TeamStats } from './poisson';

export type Nation = {
  code: string;
  name: string;
  shortName: string;
  flag: string;
  color: string;
  textOnColor: 'light' | 'dark';
};

// FIFA/World Football Elo ratings — Stand Turnierbeginn Juni 2026
export const ELO_RATINGS: Record<string, number> = {
  ARG: 2052, FRA: 2010, ESP: 1990, ENG: 1985, BRA: 1970,
  POR: 1960, NED: 1942, GER: 1933, COL: 1882, BEL: 1865,
  URU: 1855, USA: 1825, MAR: 1815, JPN: 1820, MEX: 1800,
  CAN: 1785, SEN: 1785, CRO: 1790, SUI: 1800, AUT: 1790,
  DEN: 1765, UKR: 1745, IRN: 1730, AUS: 1755, SRB: 1745,
  SWE: 1775, TUR: 1770, NOR: 1775, KOR: 1745, POL: 1735,
  CZE: 1725, ECU: 1705, SCO: 1720, SVN: 1700, CIV: 1680,
  SAU: 1660, NGA: 1680, EGY: 1660, ALG: 1650, PAR: 1640,
  BIH: 1620, CMR: 1620, GHA: 1610, TUN: 1640, COD: 1600,
  VEN: 1600, PAN: 1590, IRQ: 1570, QAT: 1555, RSA: 1550,
  UZB: 1550, JAM: 1530, JOR: 1520, CPV: 1530, HON: 1510,
  CUW: 1490, NZL: 1500, HAI: 1470,
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
  AUT: { code: 'AUT', name: 'Österreich',   shortName: 'AUT', flag: '🇦🇹', color: '#ED2939', textOnColor: 'light' },
  SUI: { code: 'SUI', name: 'Schweiz',       shortName: 'SUI', flag: '🇨🇭', color: '#FF0000', textOnColor: 'light' },
  CRO: { code: 'CRO', name: 'Kroatien',      shortName: 'KRO', flag: '🇭🇷', color: '#FF0000', textOnColor: 'light' },
  SRB: { code: 'SRB', name: 'Serbien',       shortName: 'SRB', flag: '🇷🇸', color: '#C6363C', textOnColor: 'light' },
  SCO: { code: 'SCO', name: 'Schottland',    shortName: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', color: '#003DA5', textOnColor: 'light' },
  DEN: { code: 'DEN', name: 'Dänemark',     shortName: 'DEN', flag: '🇩🇰', color: '#C60C30', textOnColor: 'light' },
  TUR: { code: 'TUR', name: 'Türkei',       shortName: 'TUR', flag: '🇹🇷', color: '#E30A17', textOnColor: 'light' },
  POL: { code: 'POL', name: 'Polen',         shortName: 'POL', flag: '🇵🇱', color: '#DC143C', textOnColor: 'light' },
  SVN: { code: 'SVN', name: 'Slowenien',     shortName: 'SVN', flag: '🇸🇮', color: '#003DA5', textOnColor: 'light' },
  UKR: { code: 'UKR', name: 'Ukraine',       shortName: 'UKR', flag: '🇺🇦', color: '#005BBB', textOnColor: 'light' },
  // AFC
  JPN: { code: 'JPN', name: 'Japan',         shortName: 'JPN', flag: '🇯🇵', color: '#BC002D', textOnColor: 'light' },
  KOR: { code: 'KOR', name: 'Südkorea',     shortName: 'KOR', flag: '🇰🇷', color: '#003478', textOnColor: 'light' },
  IRN: { code: 'IRN', name: 'Iran',          shortName: 'IRN', flag: '🇮🇷', color: '#239F40', textOnColor: 'light' },
  AUS: { code: 'AUS', name: 'Australien',    shortName: 'AUS', flag: '🇦🇺', color: '#FFD700', textOnColor: 'dark'  },
  SAU: { code: 'SAU', name: 'Saudi-Arabien', shortName: 'SAU', flag: '🇸🇦', color: '#006C35', textOnColor: 'light' },
  QAT: { code: 'QAT', name: 'Katar',         shortName: 'QAT', flag: '🇶🇦', color: '#8D1B3D', textOnColor: 'light' },
  IRQ: { code: 'IRQ', name: 'Irak',          shortName: 'IRQ', flag: '🇮🇶', color: '#007A3D', textOnColor: 'light' },
  JOR: { code: 'JOR', name: 'Jordanien',     shortName: 'JOR', flag: '🇯🇴', color: '#007A3D', textOnColor: 'light' },
  // CAF
  MAR: { code: 'MAR', name: 'Marokko',       shortName: 'MAR', flag: '🇲🇦', color: '#C1272D', textOnColor: 'light' },
  SEN: { code: 'SEN', name: 'Senegal',       shortName: 'SEN', flag: '🇸🇳', color: '#00853F', textOnColor: 'light' },
  EGY: { code: 'EGY', name: 'Ägypten',      shortName: 'EGY', flag: '🇪🇬', color: '#CE1126', textOnColor: 'light' },
  NGA: { code: 'NGA', name: 'Nigeria',       shortName: 'NGA', flag: '🇳🇬', color: '#008751', textOnColor: 'light' },
  CIV: { code: 'CIV', name: 'Elfenbeinküste', shortName: 'CIV', flag: '🇨🇮', color: '#F77F00', textOnColor: 'light' },
  GHA: { code: 'GHA', name: 'Ghana',         shortName: 'GHA', flag: '🇬🇭', color: '#006B3F', textOnColor: 'light' },
  CMR: { code: 'CMR', name: 'Kamerun',       shortName: 'CMR', flag: '🇨🇲', color: '#007A5E', textOnColor: 'light' },
  TUN: { code: 'TUN', name: 'Tunesien',      shortName: 'TUN', flag: '🇹🇳', color: '#E70013', textOnColor: 'light' },
  RSA: { code: 'RSA', name: 'Südafrika',    shortName: 'RSA', flag: '🇿🇦', color: '#007A4D', textOnColor: 'light' },
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
// rank: StatsBomb-Rang (IPF-Angriffsstaerke, absteigend) fuer WM-2018/2022-Teams,
//       sonst ungefaehre FIFA-Weltrangliste
// Aktualisiert via scripts/train-from-statsbomb.mjs (WM 2018 + WM 2022, IPF 50 Iter.)
// Teams ohne StatsBomb-Daten behalten vorherige schaetzung.
export const NATION_STATS: Record<string, TeamStats> = {
// Auto-generiert von scripts/train-from-statsbomb.mjs
// Basis: martj42 Länderspiele ab 2018 (WM=3x, Kontinental=1.5x, NL=1.2x, Quali=1x, Friendly=0.5x)
// Zeitdecay: Halbwertszeit 2 Jahre · Kalibrierung: StatsBomb WM 2018+2022 Gruppenphase (96 Spiele)
  ESP: { rank:  1, hGF: 3.48, hGA: 0.43, aGF: 3.48, aGA: 0.43 },
  NED: { rank:  2, hGF: 3.47, hGA: 0.59, aGF: 3.47, aGA: 0.59 },
  GER: { rank:  3, hGF: 3.44, hGA: 0.62, aGF: 3.44, aGA: 0.62 },
  ENG: { rank:  4, hGF: 3.33, hGA: 0.45, aGF: 3.33, aGA: 0.45 },
  FRA: { rank:  5, hGF: 3.31, hGA: 0.49, aGF: 3.31, aGA: 0.49 },
  POR: { rank:  6, hGF: 3.29, hGA: 0.57, aGF: 3.29, aGA: 0.57 },
  ARG: { rank:  7, hGF: 3.20, hGA: 0.33, aGF: 3.20, aGA: 0.33 },
  COL: { rank:  8, hGF: 3.07, hGA: 0.53, aGF: 3.07, aGA: 0.53 },
  NOR: { rank:  9, hGF: 3.04, hGA: 0.73, aGF: 3.04, aGA: 0.73 },
  BRA: { rank: 10, hGF: 3.03, hGA: 0.46, aGF: 3.03, aGA: 0.46 },
  JPN: { rank: 11, hGF: 2.84, hGA: 0.56, aGF: 2.84, aGA: 0.56 },
  BEL: { rank: 12, hGF: 2.74, hGA: 0.57, aGF: 2.74, aGA: 0.57 },
  SWE: { rank: 13, hGF: 2.68, hGA: 1.03, aGF: 2.68, aGA: 1.03 },
  CRO: { rank: 14, hGF: 2.65, hGA: 0.69, aGF: 2.65, aGA: 0.69 },
  SUI: { rank: 15, hGF: 2.62, hGA: 0.73, aGF: 2.62, aGA: 0.73 },
  USA: { rank: 16, hGF: 2.48, hGA: 0.66, aGF: 2.48, aGA: 0.66 },
  DEN: { rank: 17, hGF: 2.43, hGA: 0.57, aGF: 2.43, aGA: 0.57 },
  CAN: { rank: 18, hGF: 2.39, hGA: 0.67, aGF: 2.39, aGA: 0.67 },
  AUT: { rank: 19, hGF: 2.32, hGA: 0.64, aGF: 2.32, aGA: 0.64 },
  RUS: { rank: 20, hGF: 2.18, hGA: 0.64, aGF: 2.18, aGA: 0.64 },
  TUR: { rank: 21, hGF: 2.16, hGA: 0.85, aGF: 2.16, aGA: 0.85 },
  SEN: { rank: 22, hGF: 2.08, hGA: 0.82, aGF: 2.08, aGA: 0.82 },
  POL: { rank: 23, hGF: 2.04, hGA: 0.84, aGF: 2.04, aGA: 0.84 },
  URU: { rank: 24, hGF: 1.99, hGA: 0.45, aGF: 1.99, aGA: 0.45 },
  NGA: { rank: 25, hGF: 1.98, hGA: 0.75, aGF: 1.98, aGA: 0.75 },
  MAR: { rank: 26, hGF: 1.97, hGA: 0.35, aGF: 1.97, aGA: 0.35 },
  UKR: { rank: 27, hGF: 1.96, hGA: 0.89, aGF: 1.96, aGA: 0.89 },
  ALG: { rank: 28, hGF: 1.92, hGA: 0.84, aGF: 1.92, aGA: 0.84 },
  IRN: { rank: 29, hGF: 1.91, hGA: 0.83, aGF: 1.91, aGA: 0.83 },
  SRB: { rank: 30, hGF: 1.90, hGA: 0.81, aGF: 1.90, aGA: 0.81 },
  VEN: { rank: 31, hGF: 1.90, hGA: 0.82, aGF: 1.90, aGA: 0.82 },
  CZE: { rank: 32, hGF: 1.89, hGA: 0.89, aGF: 1.89, aGA: 0.89 },
  KOR: { rank: 33, hGF: 1.88, hGA: 0.80, aGF: 1.88, aGA: 0.80 },
  MEX: { rank: 34, hGF: 1.87, hGA: 0.46, aGF: 1.87, aGA: 0.46 },
  GEO: { rank: 35, hGF: 1.85, hGA: 0.94, aGF: 1.85, aGA: 0.94 },
  SCO: { rank: 36, hGF: 1.81, hGA: 0.69, aGF: 1.81, aGA: 0.69 },
  ISL: { rank: 37, hGF: 1.78, hGA: 1.20, aGF: 1.78, aGA: 1.20 },
  AUS: { rank: 38, hGF: 1.71, hGA: 0.58, aGF: 1.71, aGA: 0.58 },
  WAL: { rank: 39, hGF: 1.66, hGA: 0.81, aGF: 1.66, aGA: 0.81 },
  PAN: { rank: 40, hGF: 1.66, hGA: 1.09, aGF: 1.66, aGA: 1.09 },
  PAR: { rank: 41, hGF: 1.66, hGA: 0.73, aGF: 1.66, aGA: 0.73 },
  ECU: { rank: 42, hGF: 1.62, hGA: 0.44, aGF: 1.62, aGA: 0.44 },
  CIV: { rank: 43, hGF: 1.59, hGA: 0.57, aGF: 1.59, aGA: 0.57 },
  SVN: { rank: 44, hGF: 1.29, hGA: 0.66, aGF: 1.29, aGA: 0.66 },
  NZL: { rank: 45, hGF: 1.51, hGA: 1.07, aGF: 1.51, aGA: 1.07 },
  UZB: { rank: 46, hGF: 1.51, hGA: 0.82, aGF: 1.51, aGA: 0.82 },
  EGY: { rank: 47, hGF: 1.44, hGA: 0.70, aGF: 1.44, aGA: 0.70 },
  CPV: { rank: 48, hGF: 1.43, hGA: 0.74, aGF: 1.43, aGA: 0.74 },
  BIH: { rank: 49, hGF: 1.40, hGA: 1.09, aGF: 1.40, aGA: 1.09 },
  CMR: { rank: 50, hGF: 1.39, hGA: 0.79, aGF: 1.39, aGA: 0.79 },
  GHA: { rank: 51, hGF: 1.34, hGA: 0.89, aGF: 1.34, aGA: 0.89 },
  TUN: { rank: 52, hGF: 1.35, hGA: 1.11, aGF: 1.35, aGA: 1.11 },
  RSA: { rank: 53, hGF: 1.32, hGA: 0.88, aGF: 1.32, aGA: 0.88 },
  COD: { rank: 54, hGF: 1.13, hGA: 0.61, aGF: 1.13, aGA: 0.61 },
  QAT: { rank: 55, hGF: 1.23, hGA: 1.41, aGF: 1.23, aGA: 1.41 },
  SAU: { rank: 56, hGF: 1.17, hGA: 0.86, aGF: 1.17, aGA: 0.86 },
  HON: { rank: 57, hGF: 1.15, hGA: 1.17, aGF: 1.15, aGA: 1.17 },
  JAM: { rank: 58, hGF: 1.14, hGA: 1.22, aGF: 1.14, aGA: 1.22 },
  JOR: { rank: 59, hGF: 1.67, hGA: 1.17, aGF: 1.67, aGA: 1.17 },
  IRQ: { rank: 60, hGF: 1.17, hGA: 1.06, aGF: 1.17, aGA: 1.06 },
  CUW: { rank: 61, hGF: 0.59, hGA: 2.16, aGF: 0.59, aGA: 2.16 },
  HAI: { rank: 62, hGF: 0.93, hGA: 1.14, aGF: 0.93, aGA: 1.14 },
};
