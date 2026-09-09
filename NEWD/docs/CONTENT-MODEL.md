# Canonical Work Content Model

Every piece of work is stored once. Pages, filters, RAG, and voice navigation all read the same record.

```yaml
id: sunset-marquis-lifecycle
slug: sunset-marquis-lifecycle
status: published
title: Sunset Marquis Lifecycle Growth
client: Sunset Marquis
organization: Agency689
year_start: 2021
year_end: 2024
role: Managing Director / Lead Copywriter

capabilities:
  - copywriting
  - brand
  - growth

industries:
  - hospitality
  - travel

work_types:
  - lifecycle
  - campaign
  - voice-system

summary: One sentence written for search results and cards.
problem: The business problem in plain language.
approach: What Adam actually did.
outcome: What changed.

proof:
  - claim: Approved measurable or observable result.
    source: Internal case study or public URL.
    public: true

card:
  eyebrow: Hospitality / Growth
  image: /media/work/sunset-marquis/card.webp
  alt: Descriptive image alternative.

case_study:
  available: true
  presentation_id: sunset-marquis-overview

links:
  canonical: /work/sunset-marquis-lifecycle
  external: []

related:
  - hotel-figueroa
  - clink-hostels
```

## Content collections

- `work` — canonical projects and case studies
- `roles` — Firstsource, DGWB Interactive, Agency689, and earlier career chronology
- `organizations` — clients, employers, partners, and products
- `capabilities` — AI, Brand, Copywriting, Growth, Leadership
- `answers` — approved frequently asked answers with source links
- `recorded_responses` — prerecorded audio/video and trigger metadata
- `claims` — reusable factual claims and their evidence

## Facet rules

- Industry and capability are independent. Hospitality can surface work from AI, Brand, and Copywriting.
- `organization` describes where Adam did the work; `client` describes who benefited.
- Agentic work is tagged as AI and attributed to Agency689 or independent work as factually appropriate. `Agentic689` is not a public identity or role.
- Every quantitative claim requires a source and public/private status.
- The canonical route is always `/work/[slug]`; discipline pages never duplicate the case study.
