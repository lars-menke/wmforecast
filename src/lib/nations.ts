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
// Basierend auf Länderspielen 2023-2026, gewichtet nach Aktualitat
// rank: FIFA-Weltrangliste (ungefaehr, Stand Qualifikationsbeginn)
// Stats aus 5.658 internationalen Länderspielen (2021-2026), exponentieller Decay (365-Tage-HWZ)
// Generiert via scripts/build-nation-stats.mjs — nicht manuell editieren
export const NATION_STATS: Record<string, TeamStats> = {
// Auto-generiert von scripts/fit-model.mjs — nicht manuell editieren
// Generiert: 2026-06-10T18:30:44.581Z
// Trainiert auf 1444 Spielen ab 2018 (WM-Teams), ξ=0
// Walk-Forward Log-Loss: 1.0536 | Skalierung: sqrt(avg_goals=1.266)
  ARG: { rank:  1, hGF: 1.76, hGA: 0.63, aGF: 1.76, aGA: 0.63 },
  FRA: { rank:  2, hGF: 1.93, hGA: 0.68, aGF: 1.93, aGA: 0.68 },
  ENG: { rank:  3, hGF: 1.64, hGA: 0.60, aGF: 1.64, aGA: 0.60 },
  ESP: { rank:  4, hGF: 1.88, hGA: 0.67, aGF: 1.88, aGA: 0.67 },
  BRA: { rank:  5, hGF: 1.82, hGA: 0.61, aGF: 1.82, aGA: 0.61 },
  POR: { rank:  6, hGF: 1.87, hGA: 0.71, aGF: 1.87, aGA: 0.71 },
  NED: { rank:  7, hGF: 1.85, hGA: 0.88, aGF: 1.85, aGA: 0.88 },
  GER: { rank:  8, hGF: 1.72, hGA: 1.05, aGF: 1.72, aGA: 1.05 },
  URU: { rank:  9, hGF: 1.35, hGA: 0.73, aGF: 1.35, aGA: 0.73 },
  COL: { rank: 10, hGF: 1.47, hGA: 0.71, aGF: 1.47, aGA: 0.71 },
  BEL: { rank: 11, hGF: 1.68, hGA: 0.71, aGF: 1.68, aGA: 0.71 },
  USA: { rank: 12, hGF: 1.11, hGA: 1.04, aGF: 1.11, aGA: 1.04 },
  MEX: { rank: 13, hGF: 1.15, hGA: 1.05, aGF: 1.15, aGA: 1.05 },
  MAR: { rank: 14, hGF: 1.18, hGA: 0.69, aGF: 1.18, aGA: 0.69 },
  JPN: { rank: 15, hGF: 1.48, hGA: 0.98, aGF: 1.48, aGA: 0.98 },
  CAN: { rank: 16, hGF: 1.08, hGA: 1.11, aGF: 1.08, aGA: 1.11 },
  SEN: { rank: 17, hGF: 1.08, hGA: 0.94, aGF: 1.08, aGA: 0.94 },
  CRO: { rank: 18, hGF: 1.60, hGA: 0.94, aGF: 1.60, aGA: 0.94 },
  SUI: { rank: 19, hGF: 1.59, hGA: 0.97, aGF: 1.59, aGA: 0.97 },
  AUT: { rank: 20, hGF: 1.32, hGA: 0.88, aGF: 1.32, aGA: 0.88 },
  DEN: { rank: 21, hGF: 1.28, hGA: 0.70, aGF: 1.28, aGA: 0.70 },
  UKR: { rank: 22, hGF: 1.18, hGA: 1.16, aGF: 1.18, aGA: 1.16 },
  IRN: { rank: 23, hGF: 0.83, hGA: 1.08, aGF: 0.83, aGA: 1.08 },
  AUS: { rank: 24, hGF: 0.90, hGA: 0.94, aGF: 0.90, aGA: 0.94 },
  SRB: { rank: 25, hGF: 1.21, hGA: 1.09, aGF: 1.21, aGA: 1.09 },
  SWE: { rank: 25, hGF: 1.23, hGA: 1.21, aGF: 1.23, aGA: 1.21 },
  TUR: { rank: 26, hGF: 1.48, hGA: 1.29, aGF: 1.48, aGA: 1.29 },
  NOR: { rank: 27, hGF: 1.35, hGA: 1.15, aGF: 1.35, aGA: 1.15 },
  KOR: { rank: 27, hGF: 1.19, hGA: 1.30, aGF: 1.19, aGA: 1.30 },
  POL: { rank: 28, hGF: 1.21, hGA: 1.13, aGF: 1.21, aGA: 1.13 },
  CZE: { rank: 28, hGF: 0.99, hGA: 1.13, aGF: 0.99, aGA: 1.13 },
  ECU: { rank: 29, hGF: 1.01, hGA: 0.84, aGF: 1.01, aGA: 0.84 },
  SCO: { rank: 30, hGF: 1.17, hGA: 1.15, aGF: 1.17, aGA: 1.15 },
  SVN: { rank: 31, hGF: 0.81, hGA: 0.98, aGF: 0.81, aGA: 0.98 },
  CIV: { rank: 32, hGF: 1.06, hGA: 0.86, aGF: 1.06, aGA: 0.86 },
  SAU: { rank: 33, hGF: 0.57, hGA: 1.06, aGF: 0.57, aGA: 1.06 },
  NGA: { rank: 34, hGF: 0.96, hGA: 1.16, aGF: 0.96, aGA: 1.16 },
  EGY: { rank: 35, hGF: 0.88, hGA: 1.08, aGF: 0.88, aGA: 1.08 },
  ALG: { rank: 35, hGF: 1.32, hGA: 1.06, aGF: 1.32, aGA: 1.06 },
  PAR: { rank: 36, hGF: 0.90, hGA: 0.95, aGF: 0.90, aGA: 0.95 },
  BIH: { rank: 36, hGF: 0.55, hGA: 1.23, aGF: 0.55, aGA: 1.23 },
  CMR: { rank: 37, hGF: 0.64, hGA: 1.07, aGF: 0.64, aGA: 1.07 },
  GHA: { rank: 38, hGF: 0.83, hGA: 1.37, aGF: 0.83, aGA: 1.37 },
  TUN: { rank: 39, hGF: 0.91, hGA: 1.02, aGF: 0.91, aGA: 1.02 },
  COD: { rank: 40, hGF: 0.70, hGA: 1.18, aGF: 0.70, aGA: 1.18 },
  VEN: { rank: 40, hGF: 1.02, hGA: 1.05, aGF: 1.02, aGA: 1.05 },
  PAN: { rank: 41, hGF: 0.75, hGA: 1.85, aGF: 0.75, aGA: 1.85 },
  IRQ: { rank: 42, hGF: 0.54, hGA: 1.37, aGF: 0.54, aGA: 1.37 },
  QAT: { rank: 43, hGF: 0.84, hGA: 1.69, aGF: 0.84, aGA: 1.69 },
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
