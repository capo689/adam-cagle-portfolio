# Switchboard — narration script

Voice: brisk, operational, confident. Make routing decisions feel inspectable rather than magical.

## 01 — Classify
A support application requests a cited JSON resolution summary. It declares the task contract and latency budget, but it does not choose a model.

## 02 — Policy route
The OpenRouter registry combines live price and latency with quality measured in Proving Ground. The selector chooses the cheapest model that clears the task’s published floor.

## 03 — Privacy
PII, residency, and tenant rules run before transport. This redacted request may use a hosted model; a flagged request would be forced to the local no-egress route.

## 04 — Semantic cache
The cache searches only same-tenant results under the same policy and uses a strict point-nine-four threshold. SB-882 misses and proceeds to inference.

## 05 — Cheap attempt
The small model writes a useful summary, but one citation array violates the schema. Readability is not treated as validity.

## 06 — Evidence check
Confidence comes from schema validity, citation coverage, sample agreement, and an independent judge—not from asking the model how confident it feels. This request escalates.

## 07 — Repair and escalation
A reasoning retry still returns one unknown citation. Policy permits a single alternate-family repair, then reruns the original validator without relaxing any rule. It passes; otherwise the route ends with a human.

## 08 — Result and telemetry
The caller receives a valid, cited result with its route attached. Standard traces record three calls, fourteen-tenths of a cent in cost, and the repair event before the budget gate updates the task frontier.
