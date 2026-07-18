/**
 * TypeScript models for the Hyderabad Realty Choices WordPress REST API.
 * Base: /wp-json/hrc/v1
 *
 * These types describe the shapes observed from the live endpoints. Optional
 * fields are marked as such because the API is loosely-typed WordPress meta.
 */

export type Id = number;
export type Slug = string;

export interface BudgetRange {
  label: string;
  min: number;
  max: number;
}

export interface FilterOptions {
  property_types: string[];
  bhk: string[];
  status: string[];
  budget: BudgetRange[];
}

export interface Meta {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
  logo?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  filters: FilterOptions;
}

export interface Slide {
  id: Id;
  title: string;
  subheading?: string;
  bg_url: string;
  button_text?: string;
  button_url?: string;
}

export interface LocationSummary {
  id: Id;
  slug: Slug;
  title: string;
}

export interface Location {
  id: Id;
  slug: Slug;
  title: string;
  excerpt: string;
  content_html?: string;
  link?: string;
  featured_image?: string | false;
  project_count?: number;
}

export interface Project {
  id: Id;
  slug: Slug;
  title: string;
  excerpt: string;
  link?: string;
  featured_image?: string | false;
  gallery?: string[];
  location?: LocationSummary | null;
  builder?: string;
  price_from?: string | number;
  unit_types?: string;
  sizes?: string;
  status?: string;
  possession?: string;
  featured?: boolean;
  trending?: boolean;
  content_html?: string;
  specifications?: Record<string, string>;
  faqs?: FAQ[];
  nearby?: NearbyPlace[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface NearbyPlace {
  name: string;
  category?: string;
  distance?: string;
}

export interface Flat {
  id: Id;
  project_id: Id;
  bhk: string;
  size?: string;
  price?: string | number;
  floor_plan?: string;
  facing?: string;
  carpet_area?: string;
  built_up_area?: string;
}

export interface Amenity {
  id: Id;
  name: string;
  icon?: string;
  category?: string;
}

export interface ImageItem {
  id: Id;
  url: string;
  alt?: string;
  caption?: string;
  sizes?: Record<string, string>;
}

export interface Review {
  id: Id;
  author: string;
  rating: number;
  content: string;
  avatar?: string;
  date?: string;
  source?: string;
  project?: LocationSummary;
}

export interface Paginated<T> {
  items: T[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface SearchParams {
  location?: string;
  type?: string;
  bhk?: string;
  budget?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export interface SearchResult {
  items: Project[];
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}
