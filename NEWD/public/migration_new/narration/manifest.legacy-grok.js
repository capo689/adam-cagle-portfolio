window.CIVIC_NARRATION = {
  "model": "x-ai/grok-voice-tts-1.0",
  "format": "mp3",
  "scenarios": {
    "standard": {
      "voice": "eve",
      "voiceLabel": "Eve",
      "title": "Current event page",
      "segments": [
        {
          "id": "01-intake",
          "startNode": "Manual Trigger",
          "endNode": "Valid Input?",
          "text": "Let me walk you through the routine path first. We begin with one municipal page and a deliberately narrow promise. Before any model sees the record, deterministic preflight confirms the customer scope, source identity, usable content, and sensitive-data rules. This is the first control point. If the source cannot be trusted, the workflow stops before AI can add cost or uncertainty."
        },
        {
          "id": "02-extraction",
          "startNode": "LIVE MODE?",
          "endNode": "Rejoin Extraction Paths",
          "text": "This event page already contains clean digital text, so the workflow records that OCR is unnecessary and skips the extraction call. That is an important operating choice. We do not spend model tokens merely because a model is available. Both scanned and digital records then rejoin in one normalized structure, which keeps every downstream control consistent."
        },
        {
          "id": "03-retrieval",
          "startNode": "Build Duplicate Retrieval Task",
          "endNode": "Score Retrieval Result",
          "text": "Next, the workflow looks for likely duplicate or overlapping pages. The embedding model supplies a similarity signal, but it does not decide that two municipal records should be merged. Deterministic code ranks the candidates, measures the separation between them, and preserves the evidence needed to explain why a possible match was considered."
        },
        {
          "id": "04-disposition",
          "startNode": "Build Disposition Task",
          "endNode": "Rejoin Disposition Paths",
          "text": "Now the disposition model proposes a practical migration action, such as keep, revise, merge, archive, delete, or migrate. The model returns short evidence identifiers instead of copying long passages. Server-side code rejects unknown or repeated identifiers, resolves valid ones back to governed source text, and allows one bounded repair only when the structured response is incomplete."
        },
        {
          "id": "05-ambiguity",
          "startNode": "Ambiguity Analysis Needed?",
          "endNode": "Rejoin Ambiguity Paths",
          "text": "Because this is a routine, low-consequence page with no conflicting authority signal, deeper ambiguity analysis is not justified. The workflow records the skip rather than hiding it. This is how the design stays economical while remaining auditable. More expensive reasoning is reserved for records where it can change the review decision."
        },
        {
          "id": "06-verification",
          "startNode": "Build Grounded Verification Task",
          "endNode": "Validate Verification Result",
          "text": "A separate verification model now checks the proposed recommendation against the resolved evidence. The authoring model never grades its own work. Deterministic validation then blocks unsupported claims, invalid references, and any language that implies legal, records, accessibility, deletion, or publication authority. This recommendation clears that independent check."
        },
        {
          "id": "07-authority",
          "startNode": "Deterministic Risk + Authority Gate",
          "endNode": "Consultant Review Simulation",
          "text": "The final authority gate applies the risk floor that no model can lower. This record is supported, required no repair, and carries no elevated signal, so it reaches the standard consultant-review queue. In this guided run, the consultant approves it for staging review. That recorded outcome demonstrates the route. It does not change the website or publish anything."
        },
        {
          "id": "08-audit",
          "startNode": "Build Audit + Metrics",
          "endNode": "Final Structured Output",
          "text": "With the human outcome recorded, the workflow produces one review-ready migration record. It includes the recommendation, resolved evidence, models used, validation results, review route, observed cost, and a zero-write audit statement. The business result is faster preparation and more consistent review, while CivicPlus and the municipal customer keep every consequential authority boundary intact."
        }
      ]
    },
    "risk": {
      "voice": "ara",
      "voiceLabel": "Ara",
      "title": "Scanned budget document",
      "segments": [
        {
          "id": "01-intake",
          "startNode": "Manual Trigger",
          "endNode": "Valid Input?",
          "text": "This scenario shows how the same workflow responds when the source is harder and the consequences are higher. The record is a scanned municipal budget document. Deterministic preflight first confirms the tenant, source, page identity, and handling rules, then establishes an elevated risk floor. That floor can only stay the same or rise. No model can quietly reduce it later."
        },
        {
          "id": "02-extraction",
          "startNode": "LIVE MODE?",
          "endNode": "Rejoin Extraction Paths",
          "text": "The document is a scan, so downstream analysis cannot safely rely on existing page text. The extraction route creates a constrained OCR task, calls the evaluated extraction model, and validates the returned structure before it continues. If the document is unreadable or the response is incomplete, the system raises review instead of inventing missing content."
        },
        {
          "id": "03-retrieval",
          "startNode": "Build Duplicate Retrieval Task",
          "endNode": "Score Retrieval Result",
          "text": "Once the extracted content is normalized, the workflow retrieves possible duplicate or successor records. Embeddings narrow the candidate set, while deterministic scoring ranks each match and measures how confidently the best candidate separates from the rest. The similarity model finds evidence. It does not decide what happens to a public record."
        },
        {
          "id": "04-disposition",
          "startNode": "Build Disposition Task",
          "endNode": "Rejoin Disposition Paths",
          "text": "The disposition stage proposes a migration treatment using stable evidence identifiers. Those identifiers are validated and resolved on the server, so the reviewer receives the actual source passages rather than an unverifiable model summary. A malformed response gets one bounded, model-diverse repair. A second failure closes the path and forces accountable review."
        },
        {
          "id": "05-ambiguity",
          "startNode": "Ambiguity Analysis Needed?",
          "endNode": "Rejoin Ambiguity Paths",
          "text": "Here, deeper ambiguity analysis is warranted. Budget content can contain stale figures, conflicting versions, and records implications. The ambiguity model may flag those conflicts, but it cannot declare which source is legally authoritative. Its output is checked against a fixed vocabulary and carried forward as a review signal, not treated as municipal truth."
        },
        {
          "id": "06-verification",
          "startNode": "Build Grounded Verification Task",
          "endNode": "Validate Verification Result",
          "text": "Independent verification compares the recommendation with the resolved evidence and the claims each source is allowed to support. In this run, the recommendation is grounded and stays within the system's authority boundary. Passing verification does not erase the document's elevated risk. Quality and authority are separate decisions by design."
        },
        {
          "id": "07-authority",
          "startNode": "Deterministic Risk + Authority Gate",
          "endNode": "Senior Review Simulation",
          "text": "The authority gate now combines all accumulated signals. Even with a supported recommendation, the budget record retains its senior-review floor. A senior implementation consultant and the municipal content owner must inspect the recommendation and evidence before anything can move toward staging. In this guided run, the record is held for the accountable municipal content owner. That conservative outcome is recorded for the demonstration. No production action occurs."
        },
        {
          "id": "08-audit",
          "startNode": "Build Audit + Metrics",
          "endNode": "Final Structured Output",
          "text": "The final record preserves the extraction path, evidence resolution, ambiguity findings, verification result, senior-review decision, model registry, cost, and zero public writes. The workflow has reduced the consultant's search and preparation burden without collapsing a high-consequence record into an automated yes or no decision."
        }
      ]
    },
    "verification": {
      "voice": "rex",
      "voiceLabel": "Rex",
      "title": "Unsupported merge claim",
      "segments": [
        {
          "id": "01-intake",
          "startNode": "Manual Trigger",
          "endNode": "Valid Input?",
          "text": "This third run demonstrates the control I care about most. The workflow must be able to reject its own AI recommendation. The source record passes deterministic intake, so it is valid enough to evaluate. That does not mean every recommendation built from it deserves approval. Input validity and recommendation validity remain separate questions."
        },
        {
          "id": "02-extraction",
          "startNode": "LIVE MODE?",
          "endNode": "Rejoin Extraction Paths",
          "text": "The source already contains machine-readable text, so OCR is skipped and that choice is written to the audit trail. The workflow normalizes the record and moves forward without an unnecessary provider call. The interesting failure in this scenario will not come from the input format. It will come from a claim that outruns the evidence."
        },
        {
          "id": "03-retrieval",
          "startNode": "Build Duplicate Retrieval Task",
          "endNode": "Score Retrieval Result",
          "text": "Similarity retrieval identifies a plausible related page. Deterministic scoring confirms that the candidate deserves consideration, but similarity is not equivalence. Two pages can look alike while carrying different dates, owners, obligations, or records status. The workflow preserves that distinction for the recommendation and its later verification."
        },
        {
          "id": "04-disposition",
          "startNode": "Build Disposition Task",
          "endNode": "Rejoin Disposition Paths",
          "text": "The disposition model proposes merging the records and cites valid evidence identifiers. Structurally, the response is clean. The identifiers exist, resolve correctly, and satisfy the schema. This is exactly why schema validation alone is insufficient. A perfectly formatted answer can still make a claim that the underlying evidence does not support."
        },
        {
          "id": "05-ambiguity",
          "startNode": "Ambiguity Analysis Needed?",
          "endNode": "Rejoin Ambiguity Paths",
          "text": "The gap between the proposed merge and the available evidence triggers deeper ambiguity analysis. The model flags that the records may serve different purposes and that source authority is unresolved. It can identify the conflict, but it cannot choose which municipal record should survive. That authority remains outside the model layer."
        },
        {
          "id": "06-verification",
          "startNode": "Build Grounded Verification Task",
          "endNode": "Validate Verification Result",
          "text": "Now the independent verifier compares the merge claim with the resolved source evidence. It rejects the recommendation because the evidence supports similarity, not a safe consolidation decision. Deterministic validation turns that rejection into a required escalation. The authoring model cannot override the verifier, and the workflow does not quietly downgrade the failure."
        },
        {
          "id": "07-authority",
          "startNode": "Deterministic Risk + Authority Gate",
          "endNode": "Senior Review Simulation",
          "text": "The authority gate routes the rejected recommendation to senior review with the original evidence and the verifier's reason attached. The system succeeds by refusing to sound more certain than the record allows. In this guided run, the senior reviewer returns the recommendation for revision. The evidence and the verifier's reason stay attached, and no production action occurs."
        },
        {
          "id": "08-audit",
          "startNode": "Build Audit + Metrics",
          "endNode": "Final Structured Output",
          "text": "The audit preserves the proposed merge, resolved evidence, ambiguity finding, verification rejection, escalation route, human outcome, and zero writes. This is responsible agent-assist in operational terms. AI accelerates the investigation, but independent verification and named human authority determine whether the recommendation can advance."
        }
      ]
    }
  }
};
