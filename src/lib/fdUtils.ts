// Shared football-data.org TLA → FIFA 3-letter code mapping
export const FD_TLA_MAP: Record<string, string> = {
  'GER': 'GER', 'BRA': 'BRA', 'FRA': 'FRA', 'ARG': 'ARG',
  'ENG': 'ENG', 'ESP': 'ESP', 'POR': 'POR', 'NED': 'NED',
  'USA': 'USA', 'MEX': 'MEX', 'CAN': 'CAN',
  'KOR': 'KOR', 'JPN': 'JPN', 'AUS': 'AUS',
  'BEL': 'BEL', 'CRO': 'CRO', 'DEN': 'DEN', 'POL': 'POL',
  'SRB': 'SRB', 'SUI': 'SUI', 'TUR': 'TUR', 'URU': 'URU',
  'COL': 'COL', 'ECU': 'ECU', 'PAR': 'PAR',
  'MAR': 'MAR', 'SEN': 'SEN', 'NGA': 'NGA', 'GHA': 'GHA',
  'CMR': 'CMR', 'EGY': 'EGY', 'TUN': 'TUN', 'ALG': 'ALG',
  'IRN': 'IRN', 'SAU': 'SAU', 'JOR': 'JOR', 'IRQ': 'IRQ',
  'QAT': 'QAT', 'UZB': 'UZB',
  'NOR': 'NOR', 'SWE': 'SWE', 'AUT': 'AUT', 'SCO': 'SCO',
  'RSA': 'RSA', 'NZL': 'NZL', 'CPV': 'CPV',
  'PAN': 'PAN', 'HAI': 'HAI',
  'SVN': 'SVN', 'UKR': 'UKR',
  'VEN': 'VEN', 'JAM': 'JAM', 'HON': 'HON',
  'CIV': 'CIV', 'COD': 'COD', 'BIH': 'BIH', 'CUW': 'CUW',
  'CZE': 'CZE',
  // fd.org divergences
  'GBR': 'ENG',
};

export function resolveTla(tla: string): string {
  return FD_TLA_MAP[tla] ?? tla;
}
