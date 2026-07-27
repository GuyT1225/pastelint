# SecondDraft Editorial Rulebook

## Purpose

The SecondDraft editorial rule registry gives stable names and IDs to the small, explainable revision rules used by SecondDraft. It exists so implemented behavior can be documented, tested, and discussed without turning SecondDraft into a generic rewrite engine.

## Relationship To SecondDraft

SecondDraft is the Revise stage in the Paste -> Clean -> Revise -> Prepare workflow. PasteLint Clean prepares copied or generated text by removing mechanical cleanup problems. SecondDraft then applies bounded, deterministic editorial patterns for clarity, length, tone, structure, and review.

The registry describes rule metadata. It does not replace the SecondDraft engine, change output by itself, or authorize broad rewriting.

The engine in `js/second-draft.js` executes transformations. The loader in `js/second-draft-rule-registry.js` validates and exposes metadata from the canonical JSON registry. Loading a rule does not activate engine behavior, and registry order does not determine transformation order.

## Relationship To The Editorial Constitution

Every rule must respect PasteLint's editorial constitution:

- Preserve the user's meaning.
- Keep the user in control of the final text.
- Explain changes only when they are tied to actual behavior.
- Avoid detector-bypass, style imitation, and fake objectivity.

## Cleaning Vs. Revision

Cleaning removes text-transfer problems such as hidden characters, broken line breaks, mojibake, unsafe speech text, or spacing damage.

Revision changes wording after cleanup. A revision rule may shorten, clarify, reflow, or flag a draft, but only through implemented finite patterns and options.

Preservation is an editorial constraint supported by targeted regression fixtures. It is not a universal semantic guarantee for arbitrary input. Users must review revised output.

## Canonical JSON Registry

The canonical source of truth is:

`data/second-draft-rules.json`

The JavaScript loader reads this file. It must not duplicate the full registry in code. If the JSON cannot be loaded or validated, SecondDraft falls back to empty metadata while preserving the working tool.

## Stable ID Policy

Rule IDs are stable once introduced. Do not reuse an ID for a different rule. If behavior changes meaningfully, add a new rule ID or mark the old rule deprecated.

ID format:

`SD-CATEGORY-###`

Examples:

- `SD-CLARITY-001`
- `SD-COMPRESSION-001`
- `SD-STRUCTURE-001`

Current repetition IDs intentionally describe different concepts:

- `SD-REPETITION-001`: reduce the known filler-repetition setup sentence
- `SD-REPETITION-002`: remove later exact eligible repeated sentences in Shorter mode

## Category Policy

Current categories:

- `clarity`
- `compression`
- `repetition`
- `structure`
- `reader-orientation`
- `preservation`
- `rhythm`

Research-only future categories may be documented, but they should not be treated as active behavior until the engine and tests implement them.

## Rule Types

Allowed rule types:

- `mechanical`: predictable formatting or structure change
- `deterministic-editorial`: narrow wording change with a reliable trigger
- `interpretive-editorial`: context-sensitive editorial idea
- `advisory`: review guidance without automatic rewriting
- `preservation-rule`: constraint that governs acceptable edits

## Status Values

Allowed statuses:

- `active`: eligible for active lookup
- `inactive`: documented but not active
- `research-only`: exploratory and not active
- `deprecated`: retained for history but not active

Only `active` rules may appear in the active lookup.

## Automation Values

Allowed automation values:

- `eligible`: safe for narrow deterministic application
- `constrained`: requires a user option or limited context
- `suggestion-only`: may support guidance, not automatic change
- `explanation-only`: describes a constraint or principle
- `research-only`: not active behavior
- `deprecated`: retained only for history

## Confidence Language

Allowed confidence values:

- `high`: reliable when the trigger is exact and narrow
- `medium`: useful but context may matter
- `contextual`: depends strongly on reader, purpose, or source material

Confidence is not a claim of objective correctness.

## Source And Provenance

Every rule needs a source object:

- `type`
- `reference`

Sources may point to engine observations, editorial notes, journal work, or an editorial constitution principle. The source should explain why the rule exists without requiring pasted user text.

## Examples And Counterexamples

Examples show the intended before/after behavior. Counterexamples show where a rule should not apply or where caution is needed.

Rules without examples should normally be research-only, deprecated, or explanation-only.

## Preservation Principles

SecondDraft must not:

- invent commitments
- strengthen uncertain claims
- remove necessary context
- flatten deliberate voice
- rewrite quoted source text as if it were the user's prose
- turn review support into a hidden authorship claim

## Research-Only Rules

Research-only rules may describe promising editorial directions. They must not be included in active lookup and must not be attached to automatic output.

## Deprecation Policy

Deprecated rules stay in the registry for historical clarity. They are excluded from active lookup. A deprecated rule should explain what replaced it, if anything.

## Schema-Version Policy

`schemaVersion` describes the shape of the JSON. Loader validation accepts only the schema version it understands.

Breaking schema changes require a new schema version and loader update.

## Registry-Version Policy

`registryVersion` describes the content version of the registry. Update it when adding, removing, deprecating, or materially changing rule metadata.

## How Engine Code May Reference A Rule

Engine code may attach a rule ID only when the transformation is exact and causation is reliable.

Good:

- An exact pattern rewrite maps to the rule that describes that pattern.
- A user-enabled reflow option maps to a structure rule.

Avoid:

- Mapping a broad tone adjustment to a narrow rule.
- Mapping a visible explanation to a rule when no related change happened.
- Showing a rule as active when it is research-only or deprecated.

Some implemented transformations do not yet have a rule ID. That is preferable to attaching metadata whose trigger or purpose does not exactly match the transformation.

## Explanations Tied To Actual Transformations

Rule metadata may support explainability, but SecondDraft should only explain changes that actually occurred. The registry should not create decorative badges, confidence theater, or generic writing advice.

The current engine returns:

- `edits`, which contain internal before-and-after records
- `ruleMatches`, which associate selected observed transformations with stable IDs
- `changes`, which contain user-facing explanation strings

The page's **Why it works** area renders the visible `changes` strings. The **What changed** area renders the `edits` records. It does not currently render full registry metadata, confidence, rationale, source, or provenance. Internal `ruleMatches` and visible explanations must therefore be documented as related but distinct layers.

## Current Structure Behavior

Ordinary revision preserves blank-line-separated paragraph blocks. Sentence-flow cleanup runs inside each paragraph instead of flattening the full draft.

When the user enables reflow, each non-empty source line is trimmed and treated as a paragraph. SecondDraft emits the visible reflow explanation and `SD-STRUCTURE-001` only when the paragraph count actually changes. Normalizing extra blank lines without changing paragraph count does not justify a reflow claim.

Reflow does not infer semantic paragraph boundaries within a single long paragraph.

## Current Notification-Frame Behavior

The engine recognizes complete sentence-opening notification frames such as `We are writing to let you know that ...` and `I wanted to let you know that ...`. It removes the complete frame and retains the main statement.

Regression fixtures verify preservation of negation, approval conditions, contrast clauses, following sentences, paragraphs, dates, email addresses, phone numbers, and URLs. Non-target and quoted fixtures are also protected by the current bounded match.

These safeguards describe tested patterns, not universal semantic analysis.

## Current Direct Behavior

Direct tone activates a finite set of exact patterns and phrase substitutions. It can remove selected hesitation, convert selected recommendations into actions, tighten a known timing question, and apply defined wording substitutions.

Direct is not a universal tone model. Unrecognized wording can remain unchanged.

## Current Shorter Behavior

Shorter mode removes a defined set of filler words and phrases. It also removes a later sentence when all of these conditions hold:

- the sentence is delimited by `.`, `!`, or `?`
- it has at least five recognized words
- its lowercase normalized word sequence exactly matches an earlier eligible sentence
- it is not recognized as a bullet or numbered-list item

The first eligible occurrence remains. `SD-REPETITION-002` is attached to later exact removals. `SD-REPETITION-001` remains attached to the separate known filler-repetition rewrite.

Shorter does not perform semantic summarization, paraphrase detection, merging of similar ideas, importance ranking, or general redundancy detection.

## Prepare For SSML

Prepare for SSML stores the revised output exactly when that output contains non-whitespace text. If it does not, SecondDraft stores the original input. The handoff does not clean, trim, reflow, escape, or revise the selected value.

SSML Builder consumes the stored value only when its input is empty, dispatches its normal input event, and then removes the one-time transfer. If the builder already contains input, it does not overwrite that input or consume the pending transfer.

## Safe Registry Failure

If the JSON is missing, invalid, blocked, or unavailable:

- SecondDraft should still work.
- Visible revision output should not change.
- Rule lookup should return empty metadata.
- No pasted text should be sent anywhere.
- Validation errors should be non-user-content codes.

The fallback affects metadata lookup only. It does not change the deterministic revision pipeline or visible output.

## Proposal And Review Process

New rules should start from a real cleanup or revision problem. A proposal should include:

- the problem
- the exact trigger
- the intended behavior
- counterexamples
- preservation risks
- test cases

## What The Registry Must Never Become

The registry must never become:

- a prompt library
- generic writing advice
- style imitation
- a universal grammar authority
- a generic LLM instruction file
- an objective-judgment claim
- permission to change meaning
- permission to move Stage 1 cleanup into Stage 2 revision
