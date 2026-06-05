// WM 2026 Spielplan
// Gruppen und Kickoff-Zeiten sind Naeherungswerte und muessen gegen
// den offiziellen FIFA-Spielplan und die football-data.org apiIds verifiziert werden.
// apiId = 0 bedeutet: Platzhalter, muss vor Deployment befuellt werden.

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

// ---------------------------------------------------------------------------
// Gruppenphase: 12 Gruppen (A-L), je 4 Teams, je 6 Spiele = 72 Spiele
// Spielplan: 11. Juni - 2. Juli 2026
// ---------------------------------------------------------------------------

export const WM_SCHEDULE: WmMatch[] = [

  // ===== GRUPPE A: USA, PAR, EGY, SVN =====
  { id: 'USA-PAR-A1', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'USA', away: 'PAR', kickoff: '2026-06-11T20:00:00Z' },
  { id: 'EGY-SVN-A2', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'EGY', away: 'SVN', kickoff: '2026-06-11T23:00:00Z' },
  { id: 'USA-EGY-A3', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'USA', away: 'EGY', kickoff: '2026-06-17T20:00:00Z' },
  { id: 'PAR-SVN-A4', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'PAR', away: 'SVN', kickoff: '2026-06-17T23:00:00Z' },
  { id: 'USA-SVN-A5', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'USA', away: 'SVN', kickoff: '2026-06-26T20:00:00Z' },
  { id: 'PAR-EGY-A6', apiId: 0, group: 'A', stage: 'GROUP_STAGE', home: 'PAR', away: 'EGY', kickoff: '2026-06-26T20:00:00Z' },

  // ===== GRUPPE B: MEX, COL, CMR, KOR =====
  { id: 'MEX-COL-B1', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'MEX', away: 'COL', kickoff: '2026-06-12T17:00:00Z' },
  { id: 'CMR-KOR-B2', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'CMR', away: 'KOR', kickoff: '2026-06-12T20:00:00Z' },
  { id: 'MEX-CMR-B3', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'MEX', away: 'CMR', kickoff: '2026-06-18T17:00:00Z' },
  { id: 'COL-KOR-B4', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'COL', away: 'KOR', kickoff: '2026-06-18T20:00:00Z' },
  { id: 'MEX-KOR-B5', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'MEX', away: 'KOR', kickoff: '2026-06-27T20:00:00Z' },
  { id: 'COL-CMR-B6', apiId: 0, group: 'B', stage: 'GROUP_STAGE', home: 'COL', away: 'CMR', kickoff: '2026-06-27T20:00:00Z' },

  // ===== GRUPPE C: CAN, ECU, TUN, AUS =====
  { id: 'CAN-ECU-C1', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'CAN', away: 'ECU', kickoff: '2026-06-13T17:00:00Z' },
  { id: 'TUN-AUS-C2', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'TUN', away: 'AUS', kickoff: '2026-06-13T20:00:00Z' },
  { id: 'CAN-TUN-C3', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'CAN', away: 'TUN', kickoff: '2026-06-19T17:00:00Z' },
  { id: 'ECU-AUS-C4', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'ECU', away: 'AUS', kickoff: '2026-06-19T20:00:00Z' },
  { id: 'CAN-AUS-C5', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'CAN', away: 'AUS', kickoff: '2026-06-28T20:00:00Z' },
  { id: 'ECU-TUN-C6', apiId: 0, group: 'C', stage: 'GROUP_STAGE', home: 'ECU', away: 'TUN', kickoff: '2026-06-28T20:00:00Z' },

  // ===== GRUPPE D: BRA, JAM, GER, SAU =====
  { id: 'BRA-JAM-D1', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'BRA', away: 'JAM', kickoff: '2026-06-14T17:00:00Z' },
  { id: 'GER-SAU-D2', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'GER', away: 'SAU', kickoff: '2026-06-14T20:00:00Z' },
  { id: 'BRA-GER-D3', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'BRA', away: 'GER', kickoff: '2026-06-20T17:00:00Z' },
  { id: 'JAM-SAU-D4', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'JAM', away: 'SAU', kickoff: '2026-06-20T20:00:00Z' },
  { id: 'BRA-SAU-D5', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'BRA', away: 'SAU', kickoff: '2026-06-29T20:00:00Z' },
  { id: 'GER-JAM-D6', apiId: 0, group: 'D', stage: 'GROUP_STAGE', home: 'GER', away: 'JAM', kickoff: '2026-06-29T20:00:00Z' },

  // ===== GRUPPE E: ARG, HON, FRA, IRN =====
  { id: 'ARG-HON-E1', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'ARG', away: 'HON', kickoff: '2026-06-15T17:00:00Z' },
  { id: 'FRA-IRN-E2', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'FRA', away: 'IRN', kickoff: '2026-06-15T20:00:00Z' },
  { id: 'ARG-FRA-E3', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'ARG', away: 'FRA', kickoff: '2026-06-21T17:00:00Z' },
  { id: 'HON-IRN-E4', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'HON', away: 'IRN', kickoff: '2026-06-21T20:00:00Z' },
  { id: 'ARG-IRN-E5', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'ARG', away: 'IRN', kickoff: '2026-06-30T20:00:00Z' },
  { id: 'HON-FRA-E6', apiId: 0, group: 'E', stage: 'GROUP_STAGE', home: 'HON', away: 'FRA', kickoff: '2026-06-30T20:00:00Z' },

  // ===== GRUPPE F: URU, PAN, ENG, RSA =====
  { id: 'URU-PAN-F1', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'URU', away: 'PAN', kickoff: '2026-06-16T17:00:00Z' },
  { id: 'ENG-RSA-F2', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'ENG', away: 'RSA', kickoff: '2026-06-16T20:00:00Z' },
  { id: 'URU-ENG-F3', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'URU', away: 'ENG', kickoff: '2026-06-22T17:00:00Z' },
  { id: 'PAN-RSA-F4', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'PAN', away: 'RSA', kickoff: '2026-06-22T20:00:00Z' },
  { id: 'URU-RSA-F5', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'URU', away: 'RSA', kickoff: '2026-07-01T20:00:00Z' },
  { id: 'PAN-ENG-F6', apiId: 0, group: 'F', stage: 'GROUP_STAGE', home: 'PAN', away: 'ENG', kickoff: '2026-07-01T20:00:00Z' },

  // ===== GRUPPE G: ESP, VEN, SEN, JOR =====
  { id: 'ESP-VEN-G1', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'ESP', away: 'VEN', kickoff: '2026-06-11T17:00:00Z' },
  { id: 'SEN-JOR-G2', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'SEN', away: 'JOR', kickoff: '2026-06-12T23:00:00Z' },
  { id: 'ESP-SEN-G3', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'ESP', away: 'SEN', kickoff: '2026-06-17T17:00:00Z' },
  { id: 'VEN-JOR-G4', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'VEN', away: 'JOR', kickoff: '2026-06-18T23:00:00Z' },
  { id: 'ESP-JOR-G5', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'ESP', away: 'JOR', kickoff: '2026-06-26T23:00:00Z' },
  { id: 'VEN-SEN-G6', apiId: 0, group: 'G', stage: 'GROUP_STAGE', home: 'VEN', away: 'SEN', kickoff: '2026-06-26T23:00:00Z' },

  // ===== GRUPPE H: POR, NZL, NED, NGA =====
  { id: 'POR-NZL-H1', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'POR', away: 'NZL', kickoff: '2026-06-13T23:00:00Z' },
  { id: 'NED-NGA-H2', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'NED', away: 'NGA', kickoff: '2026-06-14T23:00:00Z' },
  { id: 'POR-NED-H3', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'POR', away: 'NED', kickoff: '2026-06-19T23:00:00Z' },
  { id: 'NZL-NGA-H4', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'NZL', away: 'NGA', kickoff: '2026-06-20T23:00:00Z' },
  { id: 'POR-NGA-H5', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'POR', away: 'NGA', kickoff: '2026-06-27T23:00:00Z' },
  { id: 'NZL-NED-H6', apiId: 0, group: 'H', stage: 'GROUP_STAGE', home: 'NZL', away: 'NED', kickoff: '2026-06-27T23:00:00Z' },

  // ===== GRUPPE I: BEL, UKR, AUT, CIV =====
  { id: 'BEL-UKR-I1', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'BEL', away: 'UKR', kickoff: '2026-06-15T23:00:00Z' },
  { id: 'AUT-CIV-I2', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'AUT', away: 'CIV', kickoff: '2026-06-16T23:00:00Z' },
  { id: 'BEL-AUT-I3', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'BEL', away: 'AUT', kickoff: '2026-06-21T23:00:00Z' },
  { id: 'UKR-CIV-I4', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'UKR', away: 'CIV', kickoff: '2026-06-22T23:00:00Z' },
  { id: 'BEL-CIV-I5', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'BEL', away: 'CIV', kickoff: '2026-07-01T23:00:00Z' },
  { id: 'UKR-AUT-I6', apiId: 0, group: 'I', stage: 'GROUP_STAGE', home: 'UKR', away: 'AUT', kickoff: '2026-07-01T23:00:00Z' },

  // ===== GRUPPE J: CRO, MAR, SUI, IRQ =====
  { id: 'CRO-MAR-J1', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'CRO', away: 'MAR', kickoff: '2026-06-11T23:00:00Z' },
  { id: 'SUI-IRQ-J2', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'SUI', away: 'IRQ', kickoff: '2026-06-13T17:00:00Z' },
  { id: 'CRO-SUI-J3', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'CRO', away: 'SUI', kickoff: '2026-06-17T23:00:00Z' },
  { id: 'MAR-IRQ-J4', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'MAR', away: 'IRQ', kickoff: '2026-06-19T17:00:00Z' },
  { id: 'CRO-IRQ-J5', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'CRO', away: 'IRQ', kickoff: '2026-06-28T17:00:00Z' },
  { id: 'MAR-SUI-J6', apiId: 0, group: 'J', stage: 'GROUP_STAGE', home: 'MAR', away: 'SUI', kickoff: '2026-06-28T17:00:00Z' },

  // ===== GRUPPE K: SCO, GHA, DEN, QAT =====
  { id: 'SCO-GHA-K1', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'SCO', away: 'GHA', kickoff: '2026-06-14T17:00:00Z' }, // eigentlich Ueberschneidung mit D1 pruefen
  { id: 'DEN-QAT-K2', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'DEN', away: 'QAT', kickoff: '2026-06-15T17:00:00Z' },
  { id: 'SCO-DEN-K3', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'SCO', away: 'DEN', kickoff: '2026-06-20T23:00:00Z' },
  { id: 'GHA-QAT-K4', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'GHA', away: 'QAT', kickoff: '2026-06-21T17:00:00Z' },
  { id: 'SCO-QAT-K5', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'SCO', away: 'QAT', kickoff: '2026-06-29T17:00:00Z' },
  { id: 'GHA-DEN-K6', apiId: 0, group: 'K', stage: 'GROUP_STAGE', home: 'GHA', away: 'DEN', kickoff: '2026-06-29T17:00:00Z' },

  // ===== GRUPPE L: TUR, JPN, POL, SRB =====
  { id: 'TUR-JPN-L1', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'TUR', away: 'JPN', kickoff: '2026-06-16T17:00:00Z' },
  { id: 'POL-SRB-L2', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'POL', away: 'SRB', kickoff: '2026-06-16T23:00:00Z' },
  { id: 'TUR-POL-L3', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'TUR', away: 'POL', kickoff: '2026-06-22T17:00:00Z' },
  { id: 'JPN-SRB-L4', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'JPN', away: 'SRB', kickoff: '2026-06-22T23:00:00Z' },
  { id: 'TUR-SRB-L5', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'TUR', away: 'SRB', kickoff: '2026-07-02T20:00:00Z' },
  { id: 'JPN-POL-L6', apiId: 0, group: 'L', stage: 'GROUP_STAGE', home: 'JPN', away: 'POL', kickoff: '2026-07-02T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // K.o.-Runde: Achtelfinale (Round of 32) - 16 Spiele
  // 4. Juli - 7. Juli 2026 (Platzhalter, Teams werden nach Gruppenphase befuellt)
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
  // Viertelfinale (Round of 16) - 8 Spiele
  // 13. Juli - 16. Juli 2026
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
  // Viertelfinale (Quarter-Finals) - 4 Spiele
  // 18. Juli - 19. Juli 2026
  // ---------------------------------------------------------------------------

  { id: 'QF-M1', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-18T17:00:00Z' },
  { id: 'QF-M2', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-18T20:00:00Z' },
  { id: 'QF-M3', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-19T17:00:00Z' },
  { id: 'QF-M4', apiId: 0, group: 'QF', stage: 'QUARTER_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-19T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Halbfinale - 2 Spiele
  // 22. Juli - 23. Juli 2026
  // ---------------------------------------------------------------------------

  { id: 'SF-M1', apiId: 0, group: 'SF', stage: 'SEMI_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-22T20:00:00Z' },
  { id: 'SF-M2', apiId: 0, group: 'SF', stage: 'SEMI_FINALS', home: 'TBD', away: 'TBD', kickoff: '2026-07-23T20:00:00Z' },

  // ---------------------------------------------------------------------------
  // Spiel um Platz 3
  // ---------------------------------------------------------------------------

  { id: '3RD',    apiId: 0, group: '3RD',   stage: 'THIRD_PLACE', home: 'TBD', away: 'TBD', kickoff: '2026-07-25T17:00:00Z' },

  // ---------------------------------------------------------------------------
  // Finale
  // ---------------------------------------------------------------------------

  { id: 'FINAL',  apiId: 0, group: 'F',     stage: 'FINAL',       home: 'TBD', away: 'TBD', kickoff: '2026-07-26T20:00:00Z' },
];

// Alle Gruppen der Gruppenphase
export const WM_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type WmGroup = (typeof WM_GROUPS)[number];
