/**
 * queryOptions() factories — usable in both route loaders
 * (`context.queryClient.ensureQueryData(...)`) and components
 * (`useSuspenseQuery(...)` / `useQuery(...)`).
 */

import { queryOptions } from "@tanstack/react-query";

import { getMeta } from "@/services/meta";
import { getSlides } from "@/services/slides";
import {
  getLocations,
  getLocation,
  getLocationProjects,
} from "@/services/locations";
import {
  getProjects,
  getProject,
  type ProjectsQuery,
} from "@/services/projects";
import { getFlats, getFlat, type FlatsQuery } from "@/services/flats";
import { getAmenities } from "@/services/amenities";
import { getImages } from "@/services/images";
import { getReviews } from "@/services/reviews";
import { search } from "@/services/search";

import type { Id, SearchParams, Slug } from "@/types/hrc";
import { queryKeys } from "./keys";

const MINUTE = 60_000;

export const metaQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.meta(),
    queryFn: ({ signal }) => getMeta(signal),
    staleTime: 30 * MINUTE,
    gcTime: 60 * MINUTE,
  });

export const slidesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.slides(),
    queryFn: ({ signal }) => getSlides(signal),
    staleTime: 10 * MINUTE,
  });

export const locationsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.locations(),
    queryFn: ({ signal }) => getLocations(signal),
    staleTime: 5 * MINUTE,
  });

export const locationQueryOptions = (slug: Slug) =>
  queryOptions({
    queryKey: queryKeys.location(slug),
    queryFn: ({ signal }) => getLocation(slug, signal),
    staleTime: 5 * MINUTE,
  });

export const locationProjectsQueryOptions = (slug: Slug) =>
  queryOptions({
    queryKey: queryKeys.locationProjects(slug),
    queryFn: ({ signal }) => getLocationProjects(slug, signal),
    staleTime: 2 * MINUTE,
  });

export const projectsQueryOptions = (query?: ProjectsQuery) =>
  queryOptions({
    queryKey: queryKeys.projects(query),
    queryFn: ({ signal }) => getProjects(query, signal),
    staleTime: MINUTE,
  });

export const projectQueryOptions = (slug: Slug) =>
  queryOptions({
    queryKey: queryKeys.project(slug),
    queryFn: ({ signal }) => getProject(slug, signal),
    staleTime: 2 * MINUTE,
  });

export const flatsQueryOptions = (query?: FlatsQuery) =>
  queryOptions({
    queryKey: queryKeys.flats(query),
    queryFn: ({ signal }) => getFlats(query, signal),
    staleTime: 2 * MINUTE,
  });

export const flatQueryOptions = (id: Id) =>
  queryOptions({
    queryKey: queryKeys.flat(id),
    queryFn: ({ signal }) => getFlat(id, signal),
    staleTime: 2 * MINUTE,
  });

export const amenitiesQueryOptions = (projectId: Id) =>
  queryOptions({
    queryKey: queryKeys.amenities(projectId),
    queryFn: ({ signal }) => getAmenities(projectId, signal),
    staleTime: 10 * MINUTE,
  });

export const imagesQueryOptions = (postId: Id) =>
  queryOptions({
    queryKey: queryKeys.images(postId),
    queryFn: ({ signal }) => getImages(postId, signal),
    staleTime: 10 * MINUTE,
  });

export const reviewsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.reviews(),
    queryFn: ({ signal }) => getReviews(signal),
    staleTime: 5 * MINUTE,
  });

export const searchQueryOptions = (params: SearchParams) =>
  queryOptions({
    queryKey: queryKeys.search(params),
    queryFn: ({ signal }) => search(params, signal),
    staleTime: 30_000,
  });
