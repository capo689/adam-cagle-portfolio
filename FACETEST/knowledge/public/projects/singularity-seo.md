---
id: project.singularity_seo
type: project
title: Singularity SEO
summary: Production AI-managed WordPress SEO, AEO, and GEO system with authenticated MCP, governed proposals, approval, and rollback.
status: verified
confidence: 0.99
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags:
  - seo
  - aeo
  - mcp
  - production
aliases:
  - Singularity WPSEO
  - Singularity
entities:
  - person.adam_r_cagle
  - organization.agentic689
source_ids:
  - source.fodder.resume_v2
  - source.evidence.canonical_map
  - source.public.repository
  - source.public.portfolio.technical_writing
answerable_questions:
  - What is Singularity SEO?
  - How does Adam approach AEO?
  - Is Singularity autonomous?
---

# Overview

- Status: production product, deployed across multiple installations.
- Purpose: connect frontier AI directly to site, search, rank, competitor, and structured-content evidence so SEO and answer-engine work can be analyzed and proposed in real time.
- Origin: Adam reported dissatisfaction with conventional SEO packages treating AEO as an add-on and wanted AI to perform analysis directly, monitor competitors, and learn from measured results.
- Audience: website operators, marketers, and teams responsible for organic and AI-driven discovery.
- URL: https://adamcagle.com/wpaper/singularity-seo-white-paper-light.html

## Adam's Role

Adam conceived the system, defined the product and governance model, wrote prompts and documentation, designed the workflow and interfaces, coded and integrated major components with AI assistance, deployed and tested the system, and operates it across installations. Public evidence does not establish that every line of every component was authored manually by Adam.

## Architecture

- Native WordPress integration and REST access.
- Hosted Python 3.12 FastAPI/MCP controller and client-specific bridges.
- Auth0, JWT validation, OAuth 2.1/PKCE, scopes, tenant/site routing.
- Docker and Docker Compose for controller and bridge environments.
- Google Search Console OAuth and reporting.
- SerpApi rank tracking with quota controls.
- ChatGPT App/control surface.
- Site audits, page-level recommendations, competitive review, SEO/AEO guidance, schema/JSON-LD, batch proposals, confirmation, apply, and rollback records.
- Render hosting and health/launch verification are repository-supported.

## Product and UX

The interaction model lets a user work through ChatGPT while the system retrieves live site/search context and exposes governed actions. Important changes move through proposal and confirmation rather than invisible autonomous writes.

## AI Design

RAG/retrieval supplies site and brand context. Protected prompts and governance rules separate reusable capability from customer-specific information. Human approval and rollback are central. The system must be described as AI-managed and governed, not autonomous.

## Outcomes

- Production status and multiple installations are confirmed.
- No canonical customer count, traffic lift, revenue figure, or aggregate ranking improvement is available.
- Demonstrates authenticated MCP, API integration, multi-tenant routing, SEO/AEO domain depth, deployment, and governed action.

## Failure Modes and Controls

Incorrect recommendations, stale search data, permission errors, unsafe bulk changes, cross-tenant leakage, quota exhaustion, and overconfident AI conclusions. Controls include scopes, tenant enforcement, proposals, confirmation, protected context, quota limits, audit history, and rollback.

## Spoken Explanations

- 15 seconds: Singularity SEO lets ChatGPT analyze and improve WordPress SEO and AI-search visibility through authenticated tools, live search data, approval, and rollback.
- 30 seconds: Adam built Singularity because conventional SEO software was not treating answer engines as a first-class surface. It connects WordPress, Search Console, rank tracking, competitor evidence, and schema guidance to ChatGPT, but keeps meaningful changes governed and reversible.
- 90 seconds: Explain the origin, MCP controller, site bridges, search/rank sources, retrieval, proposals, approval, and rollback; explicitly say it is production and governed rather than autonomous.
- Hiring-manager explanation: This project demonstrates end-to-end applied-AI ownership across use-case discovery, domain strategy, Python services, MCP, OAuth, WordPress, APIs, deployment, governance, and user workflow.

## Claims

- [project.singularity.status] Singularity SEO is a production product deployed across multiple installations.
  - Status: verified
  - Confidence: 1.00
  - Sources: source.fodder.resume_v2, source.evidence.canonical_map
  - Date or period: 2026
  - Public-safe: yes
  - Notes: No installation count is public.

