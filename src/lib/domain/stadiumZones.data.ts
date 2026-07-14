import type { StadiumZone } from "./types";

export const STADIUM_ZONES: readonly StadiumZone[] = [
  {
    id: "north-entry",
    name: "North Entry Plaza",
    capacity: 6_000,
    areaSquareMeters: 4_200,
    level: 0,
  },
  {
    id: "north-concourse",
    name: "North Concourse",
    capacity: 9_000,
    areaSquareMeters: 3_400,
    level: 0,
  },
  {
    id: "east-concourse",
    name: "East Concourse",
    capacity: 8_500,
    areaSquareMeters: 3_100,
    level: 0,
  },
  {
    id: "south-concourse",
    name: "South Concourse",
    capacity: 8_000,
    areaSquareMeters: 3_300,
    level: 0,
  },
  {
    id: "west-concourse",
    name: "West Concourse",
    capacity: 8_500,
    areaSquareMeters: 3_600,
    level: 0,
  },
  {
    id: "upper-north",
    name: "Upper North Tier",
    capacity: 12_000,
    areaSquareMeters: 4_500,
    level: 2,
  },
  {
    id: "upper-east",
    name: "Upper East Tier",
    capacity: 11_000,
    areaSquareMeters: 4_100,
    level: 3,
  },
  {
    id: "transport-hub",
    name: "Stadium Transport Hub",
    capacity: 7_000,
    areaSquareMeters: 5_500,
    level: 0,
  },
] as const;
