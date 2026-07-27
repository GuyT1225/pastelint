# PasteLint Engine Changelog

This file records completed engine cycles. It describes shipped behavior only; possible extensions are labeled as future work.

## 2026-07 - Direct Modality Safety Phase 2A

### Problem

Direct mode could silently increase certainty or change meaning by replacing `may` with `can` and removing `probably`, `I think`, and `It seems that`. The substitutions could also alter quoted text and modal language inside an otherwise supported hesitant-request rewrite.

### Root Cause or Design Gap

The four Direct-only substitutions were global and context-free. They had no rule ID or final-output verification, and they ran after the narrow request-frame pass. A later substitution could therefore change the request pass's expected final value and suppress its truthful `SD-CLARITY-002` evidence.

### Implemented Safeguard

- Removed the four unsafe global Direct substitutions without adding replacements.
- Preserved the existing finite hesitant-request pass and its transformation order.
- Preserved embedded possibility, probability, negation, and conditions when a supported request frame becomes `Please ...`.
- Kept `SD-CLARITY-002` limited to the supported framed-action rewrite and retained exact final-output verification.

### Tests Added

Focused Natural-versus-Direct fixtures cover possibility, permission, capability, probability, attributed and group judgment, tentative observation, risk, recommendation, requirement, negated possibility, multiple modal terms, exact quoted language, technical and policy language, protected dates and email addresses, IVR language, contractual language, numeric estimates, already-direct text, and supported request frames containing `may`, `probably`, or `may not`. Assertions also reject obsolete modal edit rows and explanations.

### User-Visible Effect

Direct no longer turns possibility or permission into capability, probability into certainty, or attributed judgment into an unqualified assertion. Supported request framing still becomes `Please ...`, while the embedded proposition and its verified explanation, edit map, and `SD-CLARITY-002` match remain intact.

### Known Limitations

- Direct remains a finite pattern set rather than a semantic tone model.
- Removing these substitutions does not provide universal quotation parsing or semantic preservation.
- Other existing Direct transformations were not broadened or redesigned in this phase.

### Logical Future Extension

Phase 2B should audit the remaining Direct transformations individually, especially broad advisory or formality rewrites, using narrow positive fixtures, semantic counterexamples, and final-output evidence before changing behavior.

## 2026-07 - Direct Request Differentiation

### Problem

Natural and Direct could produce identical output for clearly hesitant requests because Direct had no complete request-frame transformation.

### Root Cause or Design Gap

Existing Direct behavior relied on unrelated sentence patterns and individual phrase substitutions. It did not capture a complete hesitant request, preserve its action clause as one unit, or verify the Direct-specific evidence against final output.

### Implemented Safeguard

- Added a Direct-only pass for a finite set of complete sentence- and paragraph-opening request frames.
- Rewrites a supported frame as `Please ` plus the captured action clause.
- Stops matching within the paragraph and preserves terminal punctuation, following sentences, and paragraph boundaries.
- Defers the edit, explanation, and `SD-CLARITY-002` match until the exact replacement is present after final cleanup.
- Leaves Natural, already-direct requests, unsupported conditions, non-request statements, third-party notifications, and the tested quoted form unchanged.
- Broadened `SD-CLARITY-002` metadata from one main-point phrase to the durable concept of turning a supported framed action into direct action.

### Tests Added

Regression fixtures cover:

- Natural versus Direct behavior for primary and simple hesitant requests
- multiple coordinated actions and objects
- dates, deadlines, email addresses, phone numbers, and URLs
- negation and approval conditions
- existing paragraph boundaries
- already-direct and sufficiently direct controls
- a non-request statement
- third-party notification language
- quoted language
- exact edit-map values, truthful explanations, and rule matches
- malformed-output negatives

### User-Visible Effect

Direct now produces a restrained, professional difference for supported hesitant requests, such as changing `I was wondering if you could review the revised menu.` to `Please review the revised menu.` It does not force a difference when the input is already direct.

### Known Limitations

- The pass recognizes only the documented frames.
- It does not parse arbitrary requests, quotations, or conditions.
- A supported frame inside an unsupported construction remains unchanged.
- Existing Direct phrase substitutions are separate from the complete-frame pass and still require user review.

### Logical Future Extension

The next Direct phase should audit broad single-word tone substitutions against modality and uncertainty fixtures before adding more request frames. It should favor narrower contextual patterns over global word replacement.

## 2026-07 - Second Draft Registry and Preservation Cycle

### Problem

Second Draft had useful deterministic revision behavior, but it lacked stable rule identities and precise safeguards around structure, notification-frame rewrites, SSML handoff, and Shorter-mode repetition reduction.

### Root Cause or Design Gap

- Revision patterns and visible explanations had no canonical metadata layer.
- Paragraph cleanup could obscure whether reflow had actually changed structure.
- Partial notification-frame matching could produce malformed sentences.
- The Second Draft to SSML handoff did not have a tested exact-transfer contract.
- Shorter mode removed defined filler but did not reduce later exact repeated sentences.
- Filler repetition and exact repeated-sentence removal briefly shared one rule ID even though they are different editorial concepts.

### Implemented Safeguard

- Added the versioned Second Draft JSON rule registry and validating loader with safe empty-registry fallback.
- Attached internal rule IDs only to transformations with reliable causal mappings.
- Preserved paragraph blocks during sentence-flow cleanup and made reflow reporting depend on actual paragraph-count change.
- Rewrote complete, bounded notification frames while retaining their full main clauses.
- Preserved tested negation, conditions, dates, email addresses, phone numbers, URLs, and paragraph boundaries.
- Added exact Second Draft output transfer to SSML Builder through one-time local storage consumption.
- Added deterministic later exact-sentence removal in Shorter mode.
- Kept `SD-REPETITION-001` for filler repetition and added `SD-REPETITION-002` for exact repeated-sentence removal.

### Tests Added

Regression coverage now verifies:

- registry schema validation, stable lookup behavior, active-rule filtering, and fallback
- unchanged revision output when metadata is present
- truthful paragraph reflow reporting
- preservation of existing paragraphs and tested protected values
- complete notification-frame rewriting
- preservation of negation, conditions, following sentences, and non-target or quoted fixtures
- exact Second Draft to SSML transfer and safe storage failure
- one-time SSML Builder transfer loading without overwriting existing input
- Shorter-mode exact repetition removal, Same-length preservation, short-repeat preservation, and similar-but-distinct sentence preservation
- distinct mappings for `SD-REPETITION-001` and `SD-REPETITION-002`

### User-Visible Effect

Users receive more structurally stable Second Draft output, accurate reflow notes, safer notification-frame revisions, an exact Prepare for SSML handoff, and deterministic removal of later exact eligible sentence repetitions in Shorter mode.

### Known Limitations

- Registry metadata describes the engine but does not execute transformations.
- Full registry metadata is not displayed in the current interface; visible explanations remain engine-generated strings and edit records.
- Preservation is fixture-backed and pattern-bounded, not a universal semantic guarantee.
- Direct tone is a finite pattern set rather than a general tone model.
- Reflow treats each non-empty source line as a paragraph and does not infer semantic paragraph boundaries.
- Shorter mode does not summarize, detect paraphrases, merge similar ideas, rank importance, or perform general redundancy detection.
- Exact repetition removal requires punctuation-delimited sentences with at least five recognized words and excludes recognized list items.

### Logical Future Extension

The next reasonable Shorter extension is conservative near-duplicate detection that flags candidates for user review. It should not silently remove semantically similar sentences. Any implementation would need a new rule identity, preservation thresholds, counterexamples, and regression fixtures.
