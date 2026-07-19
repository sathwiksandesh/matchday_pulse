import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { validateQuery } from "../../middleware/validate.js";
import { getVenue, listFacilities, venues, type Facility } from "./data.js";

const facilityCategories = ["restroom", "first_aid", "food", "sensory_room", "elevator", "prayer_room", "family_room"] as const;

const facilitiesQuerySchema = z
  .object({
    venueId: z.string().min(1).max(64),
    category: z.enum(facilityCategories).optional()
  })
  .strict();

export const venueRouter = Router();

function requireVenueId(param: string | undefined): string {
  if (!param) throw AppError.badRequest("A venueId path parameter is required.");
  return param;
}

venueRouter.get("/", (_req, res) => {
  res.json({
    venues: venues.map((v) => ({ id: v.id, name: v.name, city: v.city, country: v.country, capacity: v.capacity }))
  });
});

venueRouter.get("/:venueId", (req, res) => {
  const venueId = requireVenueId(req.params.venueId);
  const venue = getVenue(venueId);
  if (!venue) throw AppError.notFound(`Unknown venue: ${venueId}`);
  res.json(venue);
});

venueRouter.get("/:venueId/facilities", validateQuery(facilitiesQuerySchema.omit({ venueId: true })), (req, res) => {
  const venueId = requireVenueId(req.params.venueId);
  const venue = getVenue(venueId);
  if (!venue) throw AppError.notFound(`Unknown venue: ${venueId}`);
  const category = (req.query as { category?: Facility["category"] }).category;
  res.json({ facilities: listFacilities(venue.id, category) });
});
