---
id: case_study.vrt2_growth
type: case_study
title: VRT2 — From Shoestring Experiment to Paid Intelligence Agents
summary: Case study of Adam turning an underdefined investment-research question into a governed evidence and hypothesis system associated with ten paid follow-on agents.
status: mixed
confidence: 0.93
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags: [market-intelligence, product, zero-to-one]
aliases: []
entities: [person.adam_r_cagle, project.vrt2]
source_ids: [source.fodder.resume_v2, source.statement.adam, source.public.repository]
answerable_questions:
  - "Tell me about a project Adam moved forward with little budget or guidance."

---

# VRT2 — From Shoestring Experiment to Paid Intelligence Agents

## Executive Summary

After discussing an investment fund's needs, Adam helped define a narrow objective: improve advance warning about the direction and likely range of movement in one stock. With little guidance and a small starting budget, he developed evidence cohorts, ingestion, hypotheses, verification, and human decision support. A paid test helped carry into ten Single Stock Agent purchases.

## Problem and Constraints

The original request was exploratory, the data sources were heterogeneous, false confidence could be financially harmful, and there was no mature requirements document. The system needed to generate testable ideas without turning them into automatic trades.

## Adam's Responsibility

Problem framing, cohort design, source discovery, hypothesis logic, product and architecture decisions, data/API integration, documentation, testing, presentation, and iteration with AI assistance.

## Research and Strategy

Cohorts included buyers, sellers, suppliers, energy, transportation, executives, filings, analysts, macro conditions, and other evidence. Rather than treating every correlation as insight, the system moved signals through verification states and reduced or removed weight when performance degraded.

## Technology

Node.js, SQLite, Python backtests, scheduled data ingestion, APIs including Finnhub and EDGAR, WebSocket data, audit histories, Claude model roles, and browser automation.

## Results

A paid test helped lead to the purchase of ten Single Stock Agents. Two crypto installations were reported in conversation but remain review-only until the canonical evidence is updated. Backtest figures must always be labeled and are not financial guarantees.

## Lesson

A useful exploratory product can begin with a concrete decision, grow through testable evidence, and become commercially valuable without pretending uncertainty has disappeared.

## Detailed Interview Version

Emphasize the ambiguous start, the decision to organize evidence into cohorts and hypotheses, the verification/kill-switch system, the paid expansion, and the hard boundary against automatic trading.

