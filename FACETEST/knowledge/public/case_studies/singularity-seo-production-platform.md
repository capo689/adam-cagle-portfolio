---
id: case_study.singularity_seo
type: case_study
title: Singularity SEO — Building AEO Into the Operating System
summary: Case study of Adam's production WordPress SEO/AEO platform, from dissatisfaction with generic tools through governed MCP deployment.
status: verified
confidence: 0.98
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags: [seo, aeo, production-ai]
aliases: []
entities: [person.adam_r_cagle, project.singularity_seo]
source_ids: [source.fodder.resume_v2, source.evidence.canonical_map, source.public.repository]
answerable_questions:
  - "Tell me a detailed Singularity SEO story., How did Adam solve an AEO problem?"

---

# Singularity SEO — Building AEO Into the Operating System

## Executive Summary

Adam built Singularity SEO after concluding that conventional SEO platforms were not adequately addressing AI answers and answer-engine visibility. The production system connects ChatGPT to WordPress, Google Search Console, rank data, competitor evidence, and governed site actions through authenticated MCP infrastructure.

## Context

Agency clients relied on standard search tooling, while Google's AI answers increasingly occupied the most visible part of results. Adam believed AEO could not remain an add-on report; it needed structured content, schema, answer-oriented sections, current search evidence, and a rapid test-and-response loop.

## Problem

Generic recommendations were detached from the actual site and slow to react. A useful system needed to know the site's content and permissions, retrieve live evidence, compare competitors, propose changes, and show whether those changes helped.

## Constraints

Client isolation, protected prompts, WordPress safety, external API quotas, uncertain AI recommendations, reversible changes, and the need for a familiar control surface.

## Adam's Responsibility

Use-case definition, product strategy, architecture, prompts, governance, documentation, integration, coding with AI assistance, deployment, testing, and iteration.

## Research

SEO tool behavior, Google Search Console, ranking data, competitor changes, schema/JSON-LD, page structure, answer-engine patterns, and the timing of search-engine pulls.

## Strategy and Concept

Put the frontier model in direct contact with current site and search evidence, but constrain its actions. The system would distinguish analysis from proposals, proposals from approval, and approval from reversible application.

## Implementation and Technology

WordPress, REST, Python 3.12, FastAPI, MCP, client bridges, Docker, Auth0, JWT, OAuth 2.1/PKCE, scopes, Search Console, SerpApi, Render, health checks, batch proposals, audit records, and rollback.

## Creative Decisions

ChatGPT serves as a conversational operating surface rather than forcing users into another specialized dashboard. Content guidance addresses both human readers and answer engines without treating keyword insertion as the sole objective.

## Collaboration

The product is rooted in Agency689 client work. Exact collaborators and client permissions are not public; do not imply Adam worked entirely alone.

## Obstacles

Safe write access, multiple client installations, quota control, stale or noisy signals, and keeping shared learning separate from customer-specific data.

## Results

Production deployment across multiple installations. No canonical aggregate traffic, ranking, revenue, or user-count metric is available.

## What Adam Would Change

Not directly documented. Reasonable next questions include stronger evaluations, clearer outcome reporting, and expanded support for controlled competitor and seasonal response.

## Lessons

AI search work becomes operational when current evidence, permissions, human approval, and measurement live in one loop.

## 30-Second Spoken Version

Adam built Singularity because the SEO software he was using treated AEO like an extra report. Singularity connects ChatGPT directly to WordPress, Search Console, rank tracking, and competitor evidence. It can analyze and propose changes, but meaningful actions require approval and remain auditable and reversible.

## Detailed Interview Version

Use the context/problem/architecture/governance sequence above. Avoid unsupported customer metrics and the word autonomous.

