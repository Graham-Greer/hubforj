try {
  await import("server-only");
} catch {
  // Plain Node compatibility for future unit tests.
}

export {
  getEventSeriesById,
  getEventSeriesBySlugBase,
  getEventSeriesBySlugBaseForHub,
  getVisibleEventSeriesBySlugBase,
  getVisibleEventSeriesBySlugBaseForHub,
  listEventSeriesByHub,
  listEventSeriesByHubSlug,
  listEventSeriesOccurrences,
  listVisibleEventSeriesByIdsForHub,
} from "./event-series-queries.js";

export {
  createEventSeriesByHubSlug,
  updateEventSeriesById,
} from "./event-series-mutations.js";
