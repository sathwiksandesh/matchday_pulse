/**
 * Curated venue grounding data for a subset of FIFA World Cup 2026 host
 * stadiums. This is the authoritative source the assistant is grounded on —
 * the LLM is instructed to answer only from what's passed here, never to
 * invent a gate, route, or transit line. In production this would be synced
 * from a venue CMS/ops system instead of committed as code (see
 * docs/ARCHITECTURE.md, "Assumptions").
 */
export interface Gate {
  id: string;
  label: string;
  servesSections: string[];
  stepFree: boolean;
}

export interface Facility {
  id: string;
  category: "restroom" | "first_aid" | "food" | "sensory_room" | "elevator" | "prayer_room" | "family_room";
  label: string;
  nearestGate: string;
  stepFree: boolean;
}

export interface TransportOption {
  mode: "metro" | "shuttle" | "bus" | "rideshare" | "parking";
  label: string;
  details: string;
  accessible: boolean;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  gates: Gate[];
  facilities: Facility[];
  transport: TransportOption[];
  sustainabilityNotes: string[];
}

export const venues: Venue[] = [
  {
    id: "azteca",
    name: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    capacity: 87523,
    gates: [
      { id: "gate-1", label: "Gate 1 (North)", servesSections: ["101-115"], stepFree: false },
      { id: "gate-4", label: "Gate 4 (East)", servesSections: ["201-215"], stepFree: true },
      { id: "gate-6", label: "Gate 6 (Accessible / South)", servesSections: ["301-320"], stepFree: true }
    ],
    facilities: [
      { id: "fac-1", category: "sensory_room", label: "Quiet Sensory Room", nearestGate: "gate-6", stepFree: true },
      { id: "fac-2", category: "first_aid", label: "First Aid Station A", nearestGate: "gate-4", stepFree: true },
      { id: "fac-3", category: "elevator", label: "Concourse Elevator B", nearestGate: "gate-6", stepFree: true }
    ],
    transport: [
      { mode: "metro", label: "Line 2 - Tasqueña", details: "10-minute walk from Gate 4; step-free platform.", accessible: true },
      { mode: "shuttle", label: "Fan Shuttle Loop", details: "Runs every 15 minutes from downtown hubs; wheelchair-accessible vehicles available on request.", accessible: true },
      { mode: "parking", label: "Lot C Accessible Parking", details: "Reserved bays closest to Gate 6; permit required.", accessible: true }
    ],
    sustainabilityNotes: ["Reusable cup program at all concession stands", "Solar-assisted floodlight bank on the west stand"]
  },
  {
    id: "metlife",
    name: "MetLife Stadium",
    city: "East Rutherford",
    country: "USA",
    capacity: 82500,
    gates: [
      { id: "gate-a", label: "Gate A", servesSections: ["100-120"], stepFree: true },
      { id: "gate-c", label: "Gate C (Accessible)", servesSections: ["200-220"], stepFree: true },
      { id: "gate-e", label: "Gate E", servesSections: ["300-318"], stepFree: false }
    ],
    facilities: [
      { id: "fac-4", category: "family_room", label: "Family Care Room", nearestGate: "gate-c", stepFree: true },
      { id: "fac-5", category: "first_aid", label: "Medical Station 2", nearestGate: "gate-a", stepFree: true }
    ],
    transport: [
      { mode: "rideshare", label: "Designated Rideshare Zone", details: "East lot, 5-minute walk to Gate A.", accessible: true },
      { mode: "bus", label: "NJ Transit Express Bus", details: "Direct service from Port Authority; accessible lift on every bus.", accessible: true }
    ],
    sustainabilityNotes: ["Zero-waste concession pilot in the west concourse"]
  },
  {
    id: "bc-place",
    name: "BC Place",
    city: "Vancouver",
    country: "Canada",
    capacity: 54500,
    gates: [
      { id: "gate-north", label: "North Gate", servesSections: ["A1-A20"], stepFree: true },
      { id: "gate-south", label: "South Gate (Accessible)", servesSections: ["B1-B20"], stepFree: true }
    ],
    facilities: [
      { id: "fac-6", category: "elevator", label: "Concourse Elevator 3", nearestGate: "gate-south", stepFree: true },
      { id: "fac-7", category: "prayer_room", label: "Multi-faith Prayer Room", nearestGate: "gate-north", stepFree: true }
    ],
    transport: [
      { mode: "metro", label: "SkyTrain - Stadium-Chinatown Station", details: "Direct step-free access to North Gate.", accessible: true }
    ],
    sustainabilityNotes: ["100% renewable grid electricity", "Rainwater capture for pitch irrigation"]
  }
];

export function getVenue(id: string): Venue | undefined {
  return venues.find((v) => v.id === id);
}

export function listFacilities(venueId: string, category?: Facility["category"]): Facility[] {
  const venue = getVenue(venueId);
  if (!venue) return [];
  return category ? venue.facilities.filter((f) => f.category === category) : venue.facilities;
}
