# Realty Choices Refined

You are an expert React, TypeScript, Tailwind CSS and UX engineer.

Build a production-ready frontend for Hyderabad Realty Choices.

IMPORTANT

Do NOT redesign the website.

The current live website has already been approved by the client.

The objective is to recreate the existing website as closely as possible, including:

Overall layout

Header

Navigation

Hero section

Search bar

Cards

Colors

Typography

Buttons

Icons

Section order

Spacing

Property detail layout

Footer

Mobile responsiveness

The frontend should look like an upgraded version of the existing website, but users should immediately recognize it as the same product.

Maintain visual consistency with:

https://hyderabadrealtychoices.com

Tech Stack

React

TypeScript

Tailwind CSS

Vite

React Router

Framer Motion (subtle animations only)

Lucide Icons

Backend

The frontend must be completely headless.

Never use static property data.

All content must come from the WordPress REST APIs.

Base URL:

https://hyderabadrealtychoices.com/wp-json/hrc/v1


Available APIs

Use these APIs:

GET /locations

GET /locations/{slug}

GET /locations/{slug}/projects

GET /projects

GET /projects/{slug}

GET /flats

GET /flats/{id}

GET /amenities/{project_id}

GET /images/{post_id}

GET /reviews

GET /slides

GET /search

GET /meta


Homepage

Recreate the current homepage.

Sections:

Header

Hero Banner Slider

Search Bar

Featured Locations

Featured Projects

Trending Projects

Why Choose Hyderabad Realty Choices

Reviews

CTA

Footer

The order should match the existing website.

Search

The search UI must be identical to the current website.

Connect it to

GET /search


Support:

Location

Property Type

Flat Type

Budget

Keyword

Searching should update results without page refresh.

Property Listing

Use

GET /projects


Include

Grid/List toggle

Pagination

Loading skeletons

Empty state

Filter sidebar

Sorting

Property Detail

Use

GET /projects/{slug}


Display

Hero Image

Gallery

Price

Project Overview

Amenities

Floor Plans

Flats

Nearby

Specifications

FAQs

Reviews

Related Projects

Contact Builder

Do not invent data.

Everything comes from the API.

Locations

Use

GET /locations


Each location opens

/location/{slug}


Load

GET /locations/{slug}/projects


Reviews

Use

GET /reviews


Display exactly like current website.

Slider

Use

GET /slides


Autoplay

Infinite loop

Smooth transitions

Header

Sticky

Transparent over hero

Turns white on scroll

Mega menu identical to current website

Footer

Same sections

Same links

Same branding

Same social icons

Performance

Lazy load images

Skeleton loaders

Code splitting

Memoization

Optimized API calls

Image optimization

SEO

React Helmet

Dynamic meta title

Dynamic description

Dynamic Open Graph tags

Schema.org

Breadcrumbs

Canonical URLs

UI

Keep the same brand identity.

Do NOT change:

Primary colors

Fonts

Card style

Button style

Navigation

Section order

Use subtle animations only.

Avoid glassmorphism.

Avoid futuristic redesigns.

Avoid changing the client's approved look.

API Layer

Create

services/api.ts

services/projects.ts

services/locations.ts

services/search.ts

services/reviews.ts

services/slides.ts


All API URLs must be configurable using environment variables.

AI Ready

Design the architecture so Gemini AI can later consume project data from the same REST APIs without modifying the frontend.

Do not implement AI yet.

Just prepare the architecture.

Code Quality

Use reusable components.

Strict TypeScript.

No duplicated code.

Responsive for desktop, tablet and mobile.

Follow React best practices.

Build production-ready code only.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hyderabad-property-plus.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f809d773-41a3-47ae-9a4c-c7780d06e2c1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
