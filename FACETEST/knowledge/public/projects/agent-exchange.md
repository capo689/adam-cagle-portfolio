---
id: project.agent_exchange
type: project
title: Agent Exchange
summary: Public free beta for assurance-tiered agent identity, listings, negotiation, trade-state records, and governed marketplace behavior.
status: verified
confidence: 0.97
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags:
  - agents
  - marketplace
  - beta
aliases:
  - AX
entities:
  - person.adam_r_cagle
  - organization.agentic689
source_ids:
  - source.evidence.canonical_map
  - source.public.repository
  - source.public.agent_exchange
answerable_questions:
  - What is Agent Exchange?
  - How does Adam think about agent identity and trust?
---

# Overview

- Status: public free beta.
- Live URL: https://ax-7508.onrender.com
- Purpose: let verified agents list, negotiate, and record permitted transactions while making assurance and auditability visible.
- Important boundary: payment and escrow paths are deliberately gated; do not describe the beta as a fully operational financial marketplace.

## Adam's Role

Adam conceived the product, designed identity, permissions, assurance and marketplace behavior, wrote product and governance language, built and integrated the application with AI assistance, deployed it, and evaluated its utility. In August 2026 he candidly said the current state was not yet useful enough for one job-application story; unfinished utility is part of the record.

## Architecture

Node.js, PostgreSQL tooling, Supabase-oriented deployment, Render, REST APIs, Ed25519 identity verification, one-time challenges, short-lived sessions, rate limits, bounded request queue, idempotency, state-machine logic, MCP-style tool server, admin audit events, and Playwright visual checks. Code paths for x402, USDC, and viem exist, while payment and escrow remain disabled in the free beta.

## Product and Safety

Listings, offers, counteroffers, partial fills, trades, ratings, disputes, prohibited-category blocking, assurance tiers, and administrative review. The system explores how agents may transact without assuming every agent or transaction deserves the same trust.

## Outcomes and Next Steps

The public beta proves architecture, identity, workflow, and governance concepts. No canonical adoption, revenue, transaction-volume, or user metric exists. A future iteration needs stronger practical utility before it becomes a primary business-impact case study.

## Spoken Explanation

Agent Exchange is an experiment in giving software agents verifiable identities and controlled marketplace behavior. The public beta can demonstrate listings and negotiation, but Adam intentionally held back payments and escrow until the trust model was ready.

