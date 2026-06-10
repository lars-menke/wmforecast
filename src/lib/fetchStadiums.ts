export type Stadium = {
  name: string;
  city: string;
  capacity?: number;
};

export const WM_STADIUMS: Stadium[] = [
  { name: 'MetLife Stadium',         city: 'East Rutherford, NJ', capacity: 82500 },
  { name: 'AT&T Stadium',            city: 'Arlington, TX',       capacity: 80000 },
  { name: 'SoFi Stadium',            city: 'Inglewood, CA',       capacity: 70240 },
  { name: 'Hard Rock Stadium',       city: 'Miami Gardens, FL',   capacity: 65326 },
  { name: "Levi's Stadium",          city: 'Santa Clara, CA',     capacity: 68500 },
  { name: 'Gillette Stadium',        city: 'Foxborough, MA',      capacity: 65878 },
  { name: 'Lincoln Financial Field', city: 'Philadelphia, PA',    capacity: 69796 },
  { name: 'NRG Stadium',             city: 'Houston, TX',         capacity: 72220 },
  { name: 'Arrowhead Stadium',       city: 'Kansas City, MO',     capacity: 76416 },
  { name: 'Lumen Field',             city: 'Seattle, WA',         capacity: 68740 },
  { name: 'Mercedes-Benz Stadium',   city: 'Atlanta, GA',         capacity: 71000 },
  { name: 'BC Place',                city: 'Vancouver, BC',       capacity: 54500 },
  { name: 'BMO Field',               city: 'Toronto, ON',         capacity: 30000 },
  { name: 'Estadio Azteca',          city: 'Mexico City',         capacity: 83285 },
  { name: 'Estadio BBVA',            city: 'Monterrey',           capacity: 53500 },
  { name: 'Estadio Akron',           city: 'Guadalajara',         capacity: 49850 },
];

export function findStadium(name: string): Stadium | undefined {
  const lower = name.toLowerCase();
  return WM_STADIUMS.find(s =>
    s.name.toLowerCase().includes(lower) || lower.includes(s.name.toLowerCase()),
  );
}
