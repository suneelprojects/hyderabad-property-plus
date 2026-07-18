/**
 * React Query hooks for HRC data. Components should always use these hooks
 * instead of importing services directly, so caching and typing stay
 * consistent across the app.
 */

import { useQuery } from "@tanstack/react-query";
import type { Id, SearchParams, Slug } from "@/types/hrc";
import type { ProjectsQuery } from "@/services/projects";
import type { FlatsQuery } from "@/services/flats";

import {
  amenitiesQueryOptions,
  flatQueryOptions,
  flatsQueryOptions,
  imagesQueryOptions,
  locationProjectsQueryOptions,
  locationQueryOptions,
  locationsQueryOptions,
  metaQueryOptions,
  projectQueryOptions,
  projectsQueryOptions,
  reviewsQueryOptions,
  searchQueryOptions,
  slidesQueryOptions,
} from "./options";

export * from "./keys";
export * from "./options";
export type { ProjectsQuery, FlatsQuery };

export const useMeta = () => useQuery(metaQueryOptions());
export const useSlides = () => useQuery(slidesQueryOptions());

export const useLocations = () => useQuery(locationsQueryOptions());
export const useLocation = (slug: Slug) =>
  useQuery(locationQueryOptions(slug));
export const useLocationProjects = (slug: Slug) =>
  useQuery(locationProjectsQueryOptions(slug));

export const useProjects = (query?: ProjectsQuery) =>
  useQuery(projectsQueryOptions(query));
export const useProject = (slug: Slug) => useQuery(projectQueryOptions(slug));

export const useFlats = (query?: FlatsQuery) =>
  useQuery(flatsQueryOptions(query));
export const useFlat = (id: Id) => useQuery(flatQueryOptions(id));

export const useAmenities = (projectId: Id) =>
  useQuery(amenitiesQueryOptions(projectId));
export const useImages = (postId: Id) => useQuery(imagesQueryOptions(postId));

export const useReviews = () => useQuery(reviewsQueryOptions());

export const useSearchQuery = (params: SearchParams) =>
  useQuery({
    ...searchQueryOptions(params),
    placeholderData: (prev) => prev,
  });
