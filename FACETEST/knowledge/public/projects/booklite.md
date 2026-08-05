---
id: project.booklite
type: project
title: BookLite / Auto
summary: MIT-licensed governed book-marketing reference system using one Claude-based workflow across six channels with selectable autonomy and approval gates.
status: verified
confidence: 0.97
public_safe: true
last_updated: 2026-08-04
date_start: unknown
date_end: present
tags:
  - publishing
  - marketing-agent
  - open-source
aliases:
  - Auto
  - Book Agent
entities:
  - person.adam_r_cagle
  - organization.agentic689
source_ids:
  - source.fodder.resume_v2
  - source.evidence.canonical_map
  - source.public.repository
answerable_questions:
  - What is BookLite?
  - How does Adam design selectable autonomy?
---

# Overview

BookLite is the MIT-licensed open-source Lite release of an internal book/music marketing system. It generates platform-native copy for Reddit, X, Facebook, Instagram, Goodreads, and KDP-related workflows using one Claude-centered system.

## Adam's Role

Adam conceived the use case, designed the cross-channel workflow and approval model, wrote the prompts and documentation, built the Node.js server and browser-dashboard implementation with AI assistance, integrated APIs/authentication, and published the reference system.

## Architecture

Node.js local server, vanilla JavaScript dashboard, Claude Agent SDK, direct Anthropic API calls, server-side OAuth 2.0 and OAuth 1.0a handling, environment-variable protection, attribution feedback through KDP/Rainforest-related data, and multiple channel integrations.

## Governance

Selectable autonomy allows an autonomous or human-approved mode, but canonical public description requires human review before public posting. The stale package phrase “autonomous book marketing server” does not override README and canonical governance language.

## Outcomes

Demonstrates one agent adapting content to six platforms without removing editorial responsibility. No canonical user, revenue, or campaign-performance metric is public.

## Spoken Explanation

BookLite shows how one governed agent can understand a book and generate native material for six different channels while keeping credentials server-side and a person in control of what actually gets published.

