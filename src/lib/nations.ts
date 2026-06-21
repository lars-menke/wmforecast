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
// Generiert: 2026-06-21 — WM 2018 + WM 2022 (StatsBomb open data)
// IPF 50 Iterationen, attack*1.3 als lambda-Basis
  FRA: { rank:  1, hGF: 3.69, hGA: 0.77, aGF: 3.69, aGA: 0.77 },
  ENG: { rank:  2, hGF: 2.62, hGA: 0.73, aGF: 2.62, aGA: 0.73 },
  POR: { rank:  3, hGF: 2.56, hGA: 1.23, aGF: 2.56, aGA: 1.23 },
  ARG: { rank:  4, hGF: 2.41, hGA: 1.00, aGF: 2.41, aGA: 1.00 },
  CRO: { rank:  5, hGF: 2.28, hGA: 0.78, aGF: 2.28, aGA: 0.78 },
  NED: { rank:  6, hGF: 2.26, hGA: 0.71, aGF: 2.26, aGA: 0.71 },
  BEL: { rank:  7, hGF: 2.10, hGA: 0.52, aGF: 2.10, aGA: 0.52 },
  GHA: { rank:  8, hGF: 2.07, hGA: 1.73, aGF: 2.07, aGA: 1.73 },
  ESP: { rank:  9, hGF: 2.07, hGA: 0.92, aGF: 2.07, aGA: 0.92 },
  COL: { rank: 10, hGF: 1.85, hGA: 0.54, aGF: 1.85, aGA: 0.54 },
  SEN: { rank: 11, hGF: 1.71, hGA: 1.22, aGF: 1.71, aGA: 1.22 },
  AUS: { rank: 12, hGF: 1.56, hGA: 0.95, aGF: 1.56, aGA: 0.95 },
  JPN: { rank: 13, hGF: 1.53, hGA: 1.03, aGF: 1.53, aGA: 1.03 },
  ECU: { rank: 14, hGF: 1.38, hGA: 0.82, aGF: 1.38, aGA: 0.82 },
  CAN: { rank: 15, hGF: 1.36, hGA: 1.58, aGF: 1.36, aGA: 1.58 },
  KOR: { rank: 16, hGF: 1.34, hGA: 1.32, aGF: 1.34, aGA: 1.32 },
  TUN: { rank: 17, hGF: 1.30, hGA: 0.91, aGF: 1.30, aGA: 0.91 },
  NGA: { rank: 18, hGF: 1.30, hGA: 0.86, aGF: 1.30, aGA: 0.86 },
  IRN: { rank: 19, hGF: 1.29, hGA: 1.14, aGF: 1.29, aGA: 1.14 },
  GER: { rank: 20, hGF: 1.29, hGA: 1.43, aGF: 1.29, aGA: 1.43 },
  BRA: { rank: 21, hGF: 1.25, hGA: 0.58, aGF: 1.25, aGA: 0.58 },
  SWE: { rank: 22, hGF: 1.15, hGA: 0.68, aGF: 1.15, aGA: 0.68 },
  PAN: { rank: 23, hGF: 1.12, hGA: 2.21, aGF: 1.12, aGA: 2.21 },
  CMR: { rank: 24, hGF: 1.08, hGA: 1.45, aGF: 1.08, aGA: 1.45 },
  SUI: { rank: 25, hGF: 1.07, hGA: 1.68, aGF: 1.07, aGA: 1.68 },
  SRB: { rank: 26, hGF: 1.02, hGA: 2.24, aGF: 1.02, aGA: 2.24 },
  URU: { rank: 27, hGF: 0.99, hGA: 0.37, aGF: 0.99, aGA: 0.37 },
  MAR: { rank: 28, hGF: 0.98, hGA: 0.49, aGF: 0.98, aGA: 0.49 },
  SAU: { rank: 29, hGF: 0.95, hGA: 1.79, aGF: 0.95, aGA: 1.79 },
  USA: { rank: 30, hGF: 0.89, hGA: 0.73, aGF: 0.89, aGA: 0.73 },
  DEN: { rank: 31, hGF: 0.87, hGA: 0.40, aGF: 0.87, aGA: 0.40 },
  POL: { rank: 32, hGF: 0.80, hGA: 0.94, aGF: 0.80, aGA: 0.94 },
  MEX: { rank: 33, hGF: 0.78, hGA: 1.18, aGF: 0.78, aGA: 1.18 },
  EGY: { rank: 34, hGF: 0.72, hGA: 1.67, aGF: 0.72, aGA: 1.67 },
  QAT: { rank: 35, hGF: 0.44, hGA: 1.58, aGF: 0.44, aGA: 1.58 },
  // Teams ohne StatsBomb-WM-Daten: vorherige Schaetzung behalten
  AUT: { rank: 20, hGF: 1.32, hGA: 0.88, aGF: 1.32, aGA: 0.88 },
  UKR: { rank: 22, hGF: 1.18, hGA: 1.16, aGF: 1.18, aGA: 1.16 },
  TUR: { rank: 26, hGF: 1.48, hGA: 1.29, aGF: 1.48, aGA: 1.29 },
  NOR: { rank: 27, hGF: 1.35, hGA: 1.15, aGF: 1.35, aGA: 1.15 },
  CZE: { rank: 28, hGF: 0.99, hGA: 1.13, aGF: 0.99, aGA: 1.13 },
  SCO: { rank: 30, hGF: 1.17, hGA: 1.15, aGF: 1.17, aGA: 1.15 },
  SVN: { rank: 31, hGF: 0.81, hGA: 0.98, aGF: 0.81, aGA: 0.98 },
  CIV: { rank: 32, hGF: 1.06, hGA: 0.86, aGF: 1.06, aGA: 0.86 },
  ALG: { rank: 35, hGF: 1.32, hGA: 1.06, aGF: 1.32, aGA: 1.06 },
  PAR: { rank: 36, hGF: 0.90, hGA: 0.95, aGF: 0.90, aGA: 0.95 },
  BIH: { rank: 36, hGF: 0.55, hGA: 1.23, aGF: 0.55, aGA: 1.23 },
  COD: { rank: 40, hGF: 0.70, hGA: 1.18, aGF: 0.70, aGA: 1.18 },
  VEN: { rank: 40, hGF: 1.02, hGA: 1.05, aGF: 1.02, aGA: 1.05 },
  IRQ: { rank: 42, hGF: 0.54, hGA: 1.37, aGF: 0.54, aGA: 1.37 },
  RSA: { rank: 44, hGF: 0.66, hGA: 1.06, aGF: 0.66, aGA: 1.06 },
  UZB: { rank: 44, hGF: 0.68, hGA: 1.45, aGF: 0.68, aGA: 1.45 },
  JAM: { rank: 45, hGF: 0.70, hGA: 1.92, aGF: 0.70, aGA: 1.92 },
  JOR: { rank: 46, hGF: 0.92, hGA: 1.90, aGF: 0.92, aGA: 1.90 },
  CPV: { rank: 46, hGF: 0.89, hGA: 1.52, aGF: 0.89, aGA: 1.52 },
  HON: { rank: 47, hGF: 0.49, hGA: 1.78, aGF: 0.49, aGA: 1.78 },
  CUW: { rank: 47, hGF: 0.59, hGA: 2.16, aGF: 0.59, aGA: 2.16 },
  NZL: { rank: 48, hGF: 0.43, hGA: 1.60, aGF: 0.43, aGA: 1.60 },
  HAI: { rank: 48, hGF: 0.64, hGA: 2.13, aGF: 0.64, aGA: 2.13 },

};
