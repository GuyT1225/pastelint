# SecondDraft Editorial Rulebook

## Purpose

The SecondDraft editorial rule registry gives stable names and IDs to the small, explainable revision rules used by SecondDraft. It exists so implemented behavior can be documented, tested, and discussed without turning SecondDraft into a generic rewrite engine.

## Relationship To SecondDraft

SecondDraft is Stage 2 revision support. PasteLint Clean prepares copied or generated text by removing cleanup problems. SecondDraft then helps revise that prepared text for clarity, length, tone, structure, and review.

The registry describes rule metadata. It does not replace the SecondDraft engine, change output by itself, or authorize broad rewriting.

## Relationship To The Editorial Constitution

Every rule must respect PasteLint's editorial constitution:

- Preserve the user's meaning.
- Keep the user in control of the final text.
- Explain changes only when they are tied to actual behavior.
- Avoid detector-bypass, style imitation, and fake objectivity.

## Cleaning Vs. Revision

Cleaning removes text-transfer problems such as hidden characters, broken line breaks, mojibake, unsafe speech text, or spacing damage.

Revision changes wording after cleanup. A revision rule may shorten, clarify, reflow, or flag a draft, but it must not silently change the user's intended meaning.

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

## Explanations Tied To Actual Transformations

Rule metadata may support explainability, but SecondDraft should only explain changes that actually occurred. The registry should not create decorative badges, confidence theater, or generic writing advice.

## Safe Registry Failure

If the JSON is missing, invalid, blocked, or unavailable:

- SecondDraft should still work.
- Visible revision output should not change.
- Rule lookup should return empty metadata.
- No pasted text should be sent anywhere.
- Validation errors should be non-user-content codes.

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
