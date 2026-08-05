---
id: project.vrt2
type: project
title: VRT2 / CLAW / Single Stock Intelligence
summary: MIT-licensed market-intelligence and decision-support system with 27 data streams, hypothesis tiers, verification states, and kill-switch governance.
status: verified
confidence: 0.98
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags:
  - market-intelligence
  - open-source
  - governance
aliases:
  - VRT2
  - CLAW
  - SSIA
  - Single Stock Intelligence
entities:
  - person.adam_r_cagle
  - organization.agentic689
source_ids:
  - source.fodder.resume_v2
  - source.evidence.canonical_map
  - source.public.repository
answerable_questions:
  - What is VRT2?
  - Does Adam build trading systems?
  - What was the Single Stock Intelligence outcome?
---

# Overview

- Status: MIT-licensed open-source market-intelligence and decision-support system.
- It does **not** trade automatically.
- Origin: Adam reported meeting with an investment fund in Bend, Oregon to explore advance warning about the direction and likely range of movement in a single stock, initially with little guidance and a small budget.
- Purpose: combine diverse evidence into testable hypotheses and human-readable decision support.

## Adam's Role

Adam helped define the problem, created evidence cohorts such as buyers, sellers, suppliers, energy, transportation, executive transactions, and external conditions, designed the hypothesis and verification system, built the product and documentation with AI assistance, integrated data, tested behavior, and presented the work. Exact collaborator responsibilities require confirmation.

## Architecture

Node.js, SQLite, Python backtest harness, Playwright browser agent, WebSocket ingestion, scheduled jobs, audit history, and market/data APIs. Canonical current figures: 27 data streams, 42 signals, 23 active hypotheses across six tiers, and five verification states: UNVERIFIED, SYNTAX_OK, SQL_VERIFIED, RUNTIME_VERIFIED, and PRODUCTION_VERIFIED.

Routine daily reviews may use Claude Haiku and advanced analysis Claude Sonnet. New signals receive reduced weight until proven; sub-55 percent hit rates auto-deactivate; a 20 percent drawdown triggers a system-wide kill switch.

## Outcomes

- A paid test helped carry into the purchase of ten Single Stock Agents by a technology investment fund.
- Two additional cryptocurrency installations were reported in conversation and require stronger canonical documentation before public use.
- Backtested figures include S1_LAG at 67 percent pre-inclusion hit rate and COMPOSITE_BULL at +3.65 percent over three-day holds. These are backtests, not promises or financial advice.

## Spoken Explanations

- 15 seconds: VRT2 gathers market, filing, news, executive-transaction, and macro evidence into governed hypotheses for human decision support; it never trades automatically.
- 30 seconds: Adam helped turn a small exploratory engagement into a structured single-stock intelligence system with 27 data streams, five verification states, auto-deactivation, and a kill switch. A paid test helped lead to ten additional agent purchases.
- Technical: Explain the signal/hypothesis hierarchy, verification lifecycle, weights, backtests, scheduled ingest, audit history, and human-readable briefs.

