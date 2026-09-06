# Proving Ground — narration script

Voice: calm, exact, technically credible. Let the failed release feel like a successful control.

## 01 — Test item
We begin with EV-042, a frozen golden-set case. Its input, expected behavior, evidence IDs, and hash are versioned, so this prompt revision faces the same test as the last one.

## 02 — Calibration
Two humans establish the reference label, and the judge pair must reach at least point-six kappa on a held-out slice. This rubric clears at point-seven-one. Below the floor, evaluation stops here.

## 03 — Task routing
OpenRouter selects models by evaluation role. High-volume mutation stays inexpensive, the candidate runs normally, and the two judges come from different provider families.

## 04 — System run
The candidate makes the mistake this item was designed to expose. It recommends merging two records even though the evidence proves only that they are similar.

## 05 — Independent judges
Judge A scores groundedness two. Judge B scores it zero. The system preserves the disagreement instead of averaging it into a comfortable number.

## 06 — Agreement
Deterministic arithmetic finds a two-point split, larger than the published one-point limit. The item cannot enter the aggregate yet.

## 07 — Adjudication
A frontier tie-break model sees only disputed items, keeping the expensive route bounded. A human makes the final label and checks whether the rubric needs a clearer authority anchor.

## 08 — Regression gate
Groundedness falls below its release floor. The gate blocks the candidate prompt and publishes the changed-class evidence internally. The failed release is proof that the evaluation system works.
