// WM 2026 Spielplan
// Gruppen gemaess offiziellem FIFA-Draw vom 05.12.2025
// Kickoff-Zeiten sind Naeherungswerte (UTC). apiId = 0 = Platzhalter.

export type WmStage =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

export type WmMatch = {
  id: string;
  apiId: number;
  group: string;
  stage: WmStage;
  home: string;
  away: string;
  kickoff: string; // ISO-8601 UTC
};

export const WM_SCHEDULE: WmMatch[] = [

  // ===== GRUPPE A: MEX, RSA, KOR, CZE =====
  { id: 'MEX-RSA-A1',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'MEX', away: 'RSA', kickoff: '2026-06-11T20:00:00Z' },
  { id: 'KOR-CZE-A2',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'KOR', away: 'CZE', kickoff: '2026-06-11T23:00:00Z' },
  { id: 'MEX-KOR-A3',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'MEX', away: 'KOR', kickoff: '2026-06-17T20:00:00Z' },
  { id: 'RSA-CZE-A4',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'RSA', away: 'CZE', kickoff: '2026-06-17T23:00:00Z' },
  { id: 'MEX-CZE-A5',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'MEX', away: 'CZE', kickoff: '2026-06-26T20:00:00Z' },
  { id: 'RSA-KOR-A6',  apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'RSA', away: 'KOR', kickoff: '2026-06-26T20:00:00Z' },

  // ===== GRUPPE B: CAN, BIH, QAT, SUI =====
  { id: 'CAN-BIH-B1',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'CAN', away: 'BIH', kickoff: '2026-06-12T17:00:00Z' },
  { id: 'QAT-SUI-B2',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'QAT', away: 'SUI', kickoff: '2026-06-12T20:00:00Z' },
  { id: 'CAN-QAT-B3',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'CAN', away: 'QAT', kickoff: '2026-06-18T17:00:00Z' },
  { id: 'BIH-SUI-B4',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'BIH', away: 'SUI', kickoff: '2026-06-18T20:00:00Z' },
  { id: 'CAN-SUI-B5',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'CAN', away: 'SUI', kickoff: '2026-06-27T20:00:00Z' },
  { id: 'BIH-QAT-B6',  apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'BIH', away: 'QAT', kickoff: '2026-06-27T20:00:00Z' },

  // ===== GRUPPE C: BRA, MAR, HAI, SCO =====
  { id: 'BRA-MAR-C1',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'BRA', away: 'MAR', kickoff: '2026-06-13T17:00:00Z' },
  { id: 'HAI-SCO-C2',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'HAI', away: 'SCO', kickoff: '2026-06-13T20:00:00Z' },
  { id: 'BRA-HAI-C3',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'BRA', away: 'HAI', kickoff: '2026-06-19T17:00:00Z' },
  { id: 'MAR-SCO-C4',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'MAR', away: 'SCO', kickoff: '2026-06-19T20:00:00Z' },
  { id: 'BRA-SCO-C5',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'BRA', away: 'SCO', kickoff: '2026-06-28T20:00:00Z' },
  { id: 'MAR-HAI-C6',  apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'MAR', away: 'HAI', kickoff: '2026-06-28T20:00:00Z' },

  // ===== GRUPPE D: USA, PAR, AUS, TUR =====
  { id: 'USA-PAR-D1',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'USA', away: 'PAR', kickoff: '2026-06-14T17:00:00Z' },
  { id: 'AUS-TUR-D2',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'AUS', away: 'TUR', kickoff: '2026-06-14T20:00:00Z' },
  { id: 'USA-AUS-D3',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'USA', away: 'AUS', kickoff: '2026-06-20T17:00:00Z' },
  { id: 'PAR-TUR-D4',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'PAR', away: 'TUR', kickoff: '2026-06-20T20:00:00Z' },
  { id: 'USA-TUR-D5',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'USA', away: 'TUR', kickoff: '2026-06-29T20:00:00Z' },
  { id: 'PAR-AUS-D6',  apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'PAR', away: 'AUS', kickoff: '2026-06-29T20:00:00Z' },

  // ===== GRUPPE E: GER, CUW, CIV, ECU =====
  { id: 'GER-CUW-E1',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'GER', away: 'CUW', kickoff: '2026-06-15T17:00:00Z' },
  { id: 'CIV-ECU-E2',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'CIV', away: 'ECU', kickoff: '2026-06-15T20:00:00Z' },
  { id: 'GER-CIV-E3',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'GER', away: 'CIV', kickoff: '2026-06-21T17:00:00Z' },
  { id: 'CUW-ECU-E4',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'CUW', away: 'ECU', kickoff: '2026-06-21T20:00:00Z' },
  { id: 'GER-ECU-E5',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'GER', away: 'ECU', kickoff: '2026-06-30T20:00:00Z' },
  { id: 'CUW-CIV-E6',  apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'CUW', away: 'CIV', kickoff: '2026-06-30T20:00:00Z' },

  // ===== GRUPPE F: NED, JPN, SWE, TUN =====
  { id: 'NED-JPN-F1',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'NED', away: 'JPN', kickoff: '2026-06-16T17:00:00Z' },
  { id: 'SWE-TUN-F2',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'SWE', away: 'TUN', kickoff: '2026-06-16T20:00:00Z' },
  { id: 'NED-SWE-F3',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'NED', away: 'SWE', kickoff: '2026-06-22T17:00:00Z' },
  { id: 'JPN-TUN-F4',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'JPN', away: 'TUN', kickoff: '2026-06-22T20:00:00Z' },
  { id: 'NED-TUN-F5',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'NED', away: 'TUN', kickoff: '2026-07-01T20:00:00Z' },
  { id: 'JPN-SWE-F6',  apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'JPN', away: 'SWE', kickoff: '2026-07-01T20:00:00Z' },

  // ===== GRUPPE G: BEL, EGY, IRN, NZL =====
  { id: 'BEL-EGY-G1',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'BEL', away: 'EGY', kickoff: '2026-06-11T17:00:00Z' },
  { id: 'IRN-NZL-G2',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'IRN', away: 'NZL', kickoff: '2026-06-12T23:00:00Z' },
  { id: 'BEL-IRN-G3',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'BEL', away: 'IRN', kickoff: '2026-06-17T17:00:00Z' },
  { id: 'EGY-NZL-G4',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'EGY', away: 'NZL', kickoff: '2026-06-18T23:00:00Z' },
  { id: 'BEL-NZL-G5',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'BEL', away: 'NZL', kickoff: '2026-06-26T23:00:00Z' },
  { id: 'EGY-IRN-G6',  apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'EGY', away: 'IRN', kickoff: '2026-06-26T23:00:00Z' },

  // ===== GRUPPE H: ESP, CPV, SAU, URU =====
  { id: 'ESP-CPV-H1',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'ESP', away: 'CPV', kickoff: '2026-06-13T23:00:00Z' },
  { id: 'SAU-URU-H2',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'SAU', away: 'URU', kickoff: '2026-06-14T23:00:00Z' },
  { id: 'ESP-SAU-H3',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'ESP', away: 'SAU', kickoff: '2026-06-19T23:00:00Z' },
  { id: 'CPV-URU-H4',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'CPV', away: 'URU', kickoff: '2026-06-20T23:00:00Z' },
  { id: 'ESP-URU-H5',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'ESP', away: 'URU', kickoff: '2026-06-27T23:00:00Z' },
  { id: 'CPV-SAU-H6',  apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'CPV', away: 'SAU', kickoff: '2026-06-27T23:00:00Z' },

  // ===== GRUPPE I: FRA, SEN, IRQ, NOR =====
  { id: 'FRA-SEN-I1',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'FRA', away: 'SEN', kickoff: '2026-06-15T23:00:00Z' },
  { id: 'IRQ-NOR-I2',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'IRQ', away: 'NOR', kickoff: '2026-06-16T23:00:00Z' },
  { id: 'FRA-IRQ-I3',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'FRA', away: 'IRQ', kickoff: '2026-06-21T23:00:00Z' },
  { id: 'SEN-NOR-I4',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'SEN', away: 'NOR', kickoff: '2026-06-22T23:00:00Z' },
  { id: 'FRA-NOR-I5',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'FRA', away: 'NOR', kickoff: '2026-07-01T23:00:00Z' },
  { id: 'SEN-IRQ-I6',  apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'SEN', away: 'IRQ', kickoff: '2026-07-01T23:00:00Z' },

  // ===== GRUPPE J: ARG, ALG, AUT, JOR =====
  { id: 'ARG-ALG-J1',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'ARG', away: 'ALG', kickoff: '2026-06-11T23:00:00Z' },
  { id: 'AUT-JOR-J2',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'AUT', away: 'JOR', kickoff: '2026-06-13T17:00:00Z' },
  { id: 'ARG-AUT-J3',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'ARG', away: 'AUT', kickoff: '2026-06-17T23:00:00Z' },
  { id: 'ALG-JOR-J4',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'ALG', away: 'JOR', kickoff: '2026-06-19T17:00:00Z' },
  { id: 'ARG-JOR-J5',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'ARG', away: 'JOR', kickoff: '2026-06-28T17:00:00Z' },
  { id: 'ALG-AUT-J6',  apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'ALG', away: 'AUT', kickoff: '2026-06-28T17:00:00Z' },

  // ===== GRUPPE K: POR, COD, UZB, COL =====
  { id: 'POR-COD-K1',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'POR', away: 'COD', kickoff: '2026-06-14T17:00:00Z' },
  { id: 'UZB-COL-K2',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'UZB', away: 'COL', kickoff: '2026-06-15T17:00:00Z' },
  { id: 'POR-UZB-K3',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'POR', away: 'UZB', kickoff: '2026-06-20T23:00:00Z' },
  { id: 'COD-COL-K4',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'COD', away: 'COL', kickoff: '2026-06-21T17:00:00Z' },
  { id: 'POR-COL-K5',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'POR', away: 'COL', kickoff: '2026-06-29T17:00:00Z' },
  { id: 'COD-UZB-K6',  apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'COD', away: 'UZB', kickoff: '2026-06-29T17:00:00Z' },

  // ===== GRUPPE L: ENG, CRO, GHA, PAN =====
  { id: 'ENG-CRO-L1',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'ENG', away: 'CRO', kickoff: '2026-06-16T17:00:00Z' },
  { id: 'GHA-PAN-L2',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'GHA', away: 'PAN', kickoff: '2026-06-16T23:00:00Z' },
  { id: 'ENG-GHA-L3',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'ENG', away: 'GHA', kickoff: '2026-06-22T17:00:00Z' },
  { id: 'CRO-PAN-L4',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'CRO', away: 'PAN', kickoff: '2026-06-22T23:00:00Z' },
  { id: 'ENG-PAN-L5',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'ENG', away: 'PAN', kickoff: '2026-07-02T20:00:00Z' },
  { id: 'CRO-GHA-L6',  apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'CRO', away: 'GHA', kickoff: '2026-07-02T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // K.o.-Runde: Runde der letzten 32 - 16 Spiele
  // ---------------------------------------------------------------------------

  { id: 'R32-M1',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-04T17:00:00Z' },
  { id: 'R32-M2',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-04T20:00:00Z' },
  { id: 'R32-M3',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-05T17:00:00Z' },
  { id: 'R32-M4',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-05T20:00:00Z' },
  { id: 'R32-M5',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-06T17:00:00Z' },
  { id: 'R32-M6',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-06T20:00:00Z' },
  { id: 'R32-M7',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-07T17:00:00Z' },
  { id: 'R32-M8',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-07T20:00:00Z' },
  { id: 'R32-M9',  apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-08T17:00:00Z' },
  { id: 'R32-M10', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-08T20:00:00Z' },
  { id: 'R32-M11', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-09T17:00:00Z' },
  { id: 'R32-M12', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-09T20:00:00Z' },
  { id: 'R32-M13', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-10T17:00:00Z' },
  { id: 'R32-M14', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-10T20:00:00Z' },
  { id: 'R32-M15', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-11T17:00:00Z' },
  { id: 'R32-M16', apiId: 0, group: 'R32', stage: 'ROUND_OF_32', home: 'TBD', away: 'TBD', kickoff: '2026-07-11T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Achtelfinale (Round of 16) - 8 Spiele
  // ---------------------------------------------------------------------------

  { id: 'R16-M1', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-13T17:00:00Z' },
  { id: 'R16-M2', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-13T20:00:00Z' },
  { id: 'R16-M3', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-14T17:00:00Z' },
  { id: 'R16-M4', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-14T20:00:00Z' },
  { id: 'R16-M5', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-15T17:00:00Z' },
  { id: 'R16-M6', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-15T20:00:00Z' },
  { id: 'R16-M7', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-16T17:00:00Z' },
  { id: 'R16-M8', apiId: 0, group: 'R16', stage: 'ROUND_OF_16', home: 'TBD', away: 'TBD', kickoff: '2026-07-16T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Viertelfinale - 4 Spiele
  // ---------------------------------------------------------------------------

  { id: 'QF-M1', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-18T17:00:00Z' },
  { id: 'QF-M2', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-18T20:00:00Z' },
  { id: 'QF-M3', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-19T17:00:00Z' },
  { id: 'QF-M4', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-19T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Halbfinale - 2 Spiele
  // ---------------------------------------------------------------------------

  { id: 'SF-M1', apiId: 0, group: 'SF', stage: 'SEMI_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-22T20:00:00Z' },
  { id: 'SF-M2', apiId: 0, group: 'SF', stage: 'SEMI_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-23T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Spiel um Platz 3
  // ---------------------------------------------------------------------------

  { id: '3RD',   apiId: 0, group: '3RD', stage: 'THIRD_PLACE', home: 'TBD', away: 'TBD', kickoff: '2026-07-25T17:00:00Z' },

  // ---------------------------------------------------------------------------
  // Finale
  // ---------------------------------------------------------------------------

  { id: 'FINAL', apiId: 0, group: 'FIN', stage: 'FINAL', home: 'TBD', away: 'TBD', kickoff: '2026-07-26T20:00:00Z' },
];

export const WM_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type WmGroup = (typeof WM_GROUPS)[number];
