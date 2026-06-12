// ESPN abbreviation → internal FIFA 3-letter code mapping
// Most ESPN abbreviations match FIFA codes directly; list exceptions here.
const ESPN_TLA_MAP: Record<string, string> = {
  'HAIT': 'HAI',  // Haiti
  'CUW':  'CUW',  // Curaçao (ESPN may use 'CUR')
  'CUR':  'CUW',
  'BIH':  'BIH',  // Bosnia (ESPN may use BOS)
  'BOS':  'BIH',
  'CPV':  'CPV',  // Cape Verde (ESPN may use 'CVI')
  'CVI':  'CPV',
  'COD':  'COD',  // DR Congo (ESPN may use 'DRC')
  'DRC':  'COD',
  'IRN':  'IRN',
  'KOR':  'KOR',
  'RSA':  'RSA',
  'NZL':  'NZL',
  'AUS':  'AUS',
  'SUI':  'SUI',
};

export function resolveTla(tla: string): string {
  return ESPN_TLA_MAP[tla] ?? tla;
}
