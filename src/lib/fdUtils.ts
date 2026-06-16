// ESPN abbreviation → internal FIFA 3-letter code mapping
// Most ESPN abbreviations match FIFA codes directly; list exceptions here.
const ESPN_TLA_MAP: Record<string, string> = {
  // Africa
  'RSA':  'RSA',
  'SAF':  'RSA',  // South Africa (ESPN alt)
  'EGY':  'EGY',
  'GHA':  'GHA',
  'SEN':  'SEN',
  'MAR':  'MAR',
  'MOR':  'MAR',  // Morocco (ESPN alt)
  'ALG':  'ALG',
  'NGA':  'NGA',
  'CMR':  'CMR',
  'COD':  'COD',  // DR Congo
  'DRC':  'COD',
  'TUN':  'TUN',
  'CPV':  'CPV',  // Cape Verde
  'CVI':  'CPV',
  // Asia / Middle East
  'KSA':  'SAU',  // Saudi Arabia (ESPN uses KSA)
  'SAU':  'SAU',
  'IRN':  'IRN',
  'IRI':  'IRN',  // Iran (FIFA uses IRN, ESPN sometimes IRI)
  'KOR':  'KOR',
  'JPN':  'JPN',
  'AUS':  'AUS',
  'QAT':  'QAT',
  'IRQ':  'IRQ',
  'JOR':  'JOR',
  'UZB':  'UZB',
  'NZL':  'NZL',
  // Europe
  'BIH':  'BIH',  // Bosnia
  'BOS':  'BIH',
  'CZE':  'CZE',
  'CZ':   'CZE',  // Czech Republic (ESPN alt)
  'SUI':  'SUI',
  'SCO':  'SCO',
  'CRO':  'CRO',
  'SWE':  'SWE',
  'NOR':  'NOR',
  'AUT':  'AUT',
  // Americas
  'HAI':  'HAI',
  'HAIT': 'HAI',  // Haiti (ESPN alt)
  'PAR':  'PAR',
  'PRY':  'PAR',  // Paraguay (ESPN alt)
  'URU':  'URU',
  'ECU':  'ECU',
  'PAN':  'PAN',
  'JAM':  'JAM',
  'HON':  'HON',
  'VEN':  'VEN',
  // Other
  'CUW':  'CUW',  // Curaçao
  'CUR':  'CUW',
  'CIV':  'CIV',  // Ivory Coast
  'IVC':  'CIV',
};

export function resolveTla(tla: string): string {
  return ESPN_TLA_MAP[tla] ?? tla;
}
