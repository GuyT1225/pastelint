# PasteLint Engine Architecture

## Scope

PasteLint is a browser-only text preparation suite. Its canonical workflow is:

**Paste -> Clean -> Revise -> Prepare**

Each stage has a different responsibility:

1. **Paste** accepts copied, generated, drafted, or exported text.
2. **Clean** performs deterministic, mechanical cleanup.
3. **Revise** applies bounded, deterministic editorial transformations in Second Draft.
4. **Prepare** moves reviewed text into a destination-specific workflow such as SSML Builder.

PasteLint has no text-processing backend or model call. The browser runs the transformations locally.

## Stage Boundaries

### Clean

PasteLint Clean repairs text-transfer and formatting problems. The shared engine in `js/text-clean-engine.js` normalizes line endings, hidden characters, spacing, punctuation, common typos, and adjacent repeated words. Speech-specific symbol and DB-number normalization is opt-in.

Clean is mechanical. It does not choose a tone, summarize meaning, or make broad editorial judgments.

### Revise

Second Draft in `js/second-draft.js` runs a fixed sequence of deterministic operations:

1. Normalize the input without flattening existing paragraph breaks.
2. Apply bounded sentence-pattern rules.
3. Apply exact phrase substitutions for the selected tone.
4. Apply the selected length behavior.
5. Reflow source lines only when the user enables reflow.
6. Clean sentence flow within each paragraph.
7. Normalize the result and report only changes the engine observed.

Second Draft is editorial because some operations change wording. It remains bounded because those operations are finite patterns and substitutions, not open-ended generation.

### Prepare

Prepare hands reviewed text to the next destination. The current Second Draft handoff targets SSML Builder and transfers text without revising it again.

SSML Builder has its own explicit cleaning, generation, escaping, preview, and chunking actions. Transfer into the builder does not automatically run those actions.

## Second Draft Rule Registry

The canonical registry is `data/second-draft-rules.json`. The loader and validator are in `js/second-draft-rule-registry.js`.

The registry is metadata that describes engine behavior. It does not:

- execute transformations
- determine transformation order
- enable a rule merely because metadata exists
- change visible revision output
- authorize broad rewriting

Each registry rule has a stable ID and descriptive fields for category, type, status, trigger, change, confidence, automation, source, examples, counterexamples, and tags.

The loader validates the supported schema, required fields, enum values, unique IDs and slugs, and duplicate active semantic purposes. Only active rules enter the active lookup.

If the registry cannot be fetched or validated, the loader installs a safe empty registry. Second Draft continues to revise text, active lookup returns no metadata, and the failure status contains a non-user-content error code.

## Explainability Layers

Second Draft exposes three related but separate forms of evidence:

- `edits`: internal before-and-after records for specific transformations
- `ruleMatches`: internal associations between an observed transformation and a stable registry rule ID
- visible strings: the user-facing **Why it works** list and **What changed** before-and-after map

The current page renders visible change strings and edit records. It does not render the full rule metadata, confidence, rationale, or provenance stored in the registry. A `ruleMatch` therefore supports internal traceability but is not itself a visible explanation.

Rule IDs are attached only where the code has a reliable causal mapping. Some implemented substitutions intentionally have no rule ID yet.

## Current Repetition Rules

- `SD-REPETITION-001` describes the bounded rewrite that removes setup wording from the known filler-repetition sentence.
- `SD-REPETITION-002` describes later exact repeated-sentence removal in Shorter mode.

These IDs represent separate durable editorial concepts.

## Paragraph Preservation and Reflow

Second Draft normalizes horizontal spacing without treating vertical whitespace as interchangeable with spaces. Sentence-flow cleanup runs per physical line, so meaningful single line breaks and blank-line-separated blocks survive ordinary revision.

When reflow is enabled, `reflowSecondDraftParagraphs()`:

- retains blank-line block boundaries
- recognizes bullets, numbered items, label/value rows, greetings, signoffs, signature blocks, contact lines, and short fragments
- joins a boundary only when the preceding prose line is long enough, lacks terminal punctuation, and the continuation has a high-confidence lowercase or connector relationship
- preserves the original boundary when classification is uncertain

This is a small deterministic structure model, not Markdown parsing, grammar parsing, or semantic document inference. Conservative false negatives are intentional.

Reporting is structural and truthful. The engine compares text immediately before and after the reflow pass. The visible reflow note and `SD-STRUCTURE-001` match are emitted only when that pass joins a line boundary. Later wording cleanup, horizontal-space normalization, or an unchanged reflow selection does not produce a reflow claim.

Shorter-mode exact-sentence detection operates across physical lines but reconstructs each line independently, so repetition removal does not flatten unrelated structure. Expand applies only to eligible one-line prose blocks; it does not append generated context to a multiline structural block.

## Notification-Frame Safeguards

Second Draft recognizes complete sentence-opening notification frames such as:

- `We are writing to let you know that ...`
- `We are reaching out to let you know that ...`
- `I wanted to let you know that ...`

The engine removes the complete frame and retains the main clause as a sentence. Matching is bounded to sentence or paragraph openings and requires terminal punctuation. It does not target an embedded instruction such as `Please let your supervisor know that ...`, and the regression fixture for a quoted notification sentence remains unchanged.

Tests verify that the rewrite preserves:

- `not` and `not yet`
- conditions such as `before approval`
- contrast clauses introduced by `but`
- following sentences
- paragraph boundaries
- tested dates, email addresses, phone numbers, and URLs

These are fixture-backed, pattern-bounded safeguards. They are not a universal semantic-preservation proof for arbitrary text.

## Direct Tone

Direct tone activates a finite set of patterns and phrase substitutions. Current examples include removing selected request framing and tightening a known timing question. It does not globally replace or remove `may`, `probably`, `I think`, `It seems that`, `I would like to`, or `Please be advised that`.

The Direct request-frame pass runs after shared notification, filler, and focused-mode patterns but before general tone phrase substitutions and length handling. It recognizes only these complete sentence- or paragraph-opening constructions:

- `I was` or `We were` `hoping you might be able to ...`
- `I was` or `We were` `hoping you could ...`
- `I was` or `We were` `wondering if you could ...`
- `I` or `We` `just wanted to ask if you could ...`
- `When you have a chance, could you ...`
- `If possible, could you ...`
- `Would you be able to ...`
- `Could you possibly ...`

The engine replaces the complete frame with `Please ` and the captured action clause. The captured proposition remains intact when it contains tested modal language such as `may`, `probably`, or `may not`. Matching stops within the paragraph and uses the sentence's terminal punctuation, so following sentences and paragraphs are not consumed. The current quoted request fixture is not at an eligible boundary and remains unchanged.

Direct request edits begin as pending evidence. After the remaining tone substitutions, length behavior, paragraph cleanup, and final normalization, the engine checks that the exact replacement still appears in the final output. Only then does it add the edit-map record, visible explanation, and `SD-CLARITY-002` rule match. Because later global modality substitutions no longer alter the captured proposition, verified evidence also survives for supported request frames containing the tested modal language.

Already-direct commands, `Could you please ...`, unsupported conditional requests, non-request hope statements, and third-party notification instructions do not trigger this pass.

`SD-CLARITY-002` is limited to this verified Direct request-frame pass. It is not emitted for main-point, recommendation, suggestion, outreach, alignment, intent, or courtesy language.

## Strength Preservation

Current regression invariants keep possibility, permission, capability, probability, attributed judgment, suggestion, recommendation, requirement, negation, actor, and tested conditions distinct across Natural, Direct, Shorter, and Direct + Shorter. Tone and length selection do not authorize increased obligation.

The engine no longer executes the former Direct suggestion-to-action or qualified-recommendation-to-imperative patterns. It also no longer executes global intent or courtesy deletion, shared helpfulness weakening, or the specialized outreach and alignment rewrites that could invent `need to`, `Let's`, or `before sending it`.

A separate focused-mode matcher may remove `The main point is that` only from a complete sentence-opening `The main point is that we should ...` frame. It returns `We should ...`, preserving the actor, `should`, action, negation, conditions, timing, and punctuation. The edit and explanation remain pending until the exact replacement is found after length handling, paragraph cleanup, and final normalization. This rewrite deliberately has no rule ID.

The exact-repetition helper now returns its input unchanged when it finds no later repeated sentence, so merely selecting Shorter does not reconstruct otherwise unchanged quoted text.

Exact quoted notice, recommendation, and intent fixtures remain unchanged because the unsafe broad matchers were removed and the retained main-point matcher requires an eligible boundary. The engine does not provide universal quotation parsing or semantic preservation.

Direct is finite and deterministic, not a universal tone model. Text outside its recognized patterns may remain unchanged, and each output still requires user review.

## Shorter Mode

Shorter mode currently performs two bounded forms of compression:

1. It removes a defined set of filler words and phrases.
2. It removes later exact normalized repetitions of eligible sentences.

For exact repeated-sentence removal:

- the sentence must be delimited by `.`, `!`, or `?`
- it must contain at least five recognized words
- its lowercase normalized word sequence must exactly match an earlier eligible sentence
- a bullet or numbered-list item is excluded
- the first eligible occurrence is kept
- later exact occurrences are removed
- the behavior runs only in Shorter mode

Shorter does not perform semantic summarization, paraphrase detection, general redundancy detection, merging of similar ideas, or importance ranking. Similar but non-identical sentences remain. Short repeated statements below the threshold remain.

A logical future extension is conservative near-duplicate detection presented for review, with explicit preservation thresholds and regression fixtures. That extension is not implemented.

Final sentence-flow normalization preserves lowercase `a.m.` and `p.m.` while retaining real sentence boundaries and ordinary capitalization after actual sentence endings. The exact-repetition splitter temporarily protects those two time abbreviations so a removed duplicate does not reconstruct them as `a. M.` or `p. M.`. Commas immediately following the tested abbreviations are also preserved.

This is a narrow time-abbreviation safeguard, not universal abbreviation parsing or general sentence tokenization.

## Protected Values and Meaning

The current engine preserves dates, email addresses, phone numbers, URLs, negation, conditions, and paragraph structure in the regression fixtures for this cycle. It does so through narrow patterns and structure-aware processing rather than through a general protected-token subsystem.

The registry's preservation rule is an editorial constraint. It should not be read as a universal guarantee that every possible deterministic substitution preserves every nuance. Review remains part of the workflow.

## Exact Second Draft to SSML Transfer

When the user chooses **Prepare for SSML**:

1. Second Draft selects the revised output if it contains non-whitespace text.
2. Otherwise it selects the original input.
3. It stores that selected value under `pastelint-transfer-text` in `localStorage`.
4. It does not clean, trim, reflow, escape, or otherwise transform the stored value.

When SSML Builder loads:

1. It consumes the transfer only if its input is empty.
2. It assigns the exact stored value to the input.
3. It dispatches the normal input event so counters update.
4. It removes the stored transfer after loading it.

If SSML Builder already contains input, the pending transfer is left untouched. If storage is unavailable, Second Draft leaves the source and output intact and presents a manual-copy fallback status.

## SSML Builder Preservation and Escaping

SSML Builder keeps raw input, reviewed cleaned text, and generated SSML as separate states.

- Generate uses reviewed cleaned text when that field is non-empty; otherwise it uses the raw input with the current social-handle preparation.
- Generate from cleaned text uses the cleaned field exactly as its source.
- `wrapSSML()` escapes `&`, `<`, and `>` before placing text inside the SSML wrapper.
- Escaping prevents source text from becoming unintended XML markup.
- Cleaning, contact normalization, DB-number formatting, footer insertion, and chunking occur only through their explicit builder paths.
- Book-aware chunking and oversized-text fallback keep chunks within the configured character limit where the implementation can split them.

Browser speech preview is a proofreading aid, not final audio validation.

## Regression-Protected Invariants

The no-dependency suite in `tests/regression.js` protects these engine invariants:

- hidden-character cleanup preserves recoverable word boundaries
- punctuation repair avoids tested time, number, URL, and email boundaries
- PDF cleanup preserves truthful paragraph flow
- registry metadata validates and fails safely
- registry metadata does not change revision output
- paragraph reporting reflects actual structural change
- notification-frame rewrites retain the complete main statement
- tested negation, conditions, protected values, and paragraphs survive revision
- filler repetition and exact repeated sentences map to different stable rule IDs
- exact repetition removal is limited to Shorter mode and exact eligible sentences
- Prepare transfers the exact selected text
- SSML Builder consumes transfers once and does not overwrite existing input
- SSML generation preserves reviewed cleaned text and escapes XML-sensitive characters
- chunking, catalog records, large scripts, and empty actions retain their tested safety behavior

Run the suite with:

```powershell
node tests/regression.js
```

## Current Boundary for the Next Engine Phase

Future engine work should begin with a concrete failure fixture and a preservation analysis. The most direct Shorter extension is review-only near-duplicate detection, not silent semantic compression. Any new behavior should receive a distinct stable rule ID, exact trigger documentation, counterexamples, and regression coverage before public capability claims change.
