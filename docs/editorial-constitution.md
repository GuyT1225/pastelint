# PasteLint Editorial Constitution

## Status and authority

**Status:** Canonical.

**Scope:** PasteLint's enduring editorial principles across product behavior, transformation, publication, research, documentation, and future editorial work.

This document is the highest-level authority for PasteLint's enduring editorial principles. It governs the product, its text transformations, the Text Preparation Journal, research and knowledge work, documentation, and future editorial publications.

The Constitution states what must remain true as implementation changes. Domain documents translate these principles into architecture, workflow, publishing, analytics, engine, component, and QA rules. The [Codex Dispatch Standard](codex-dispatch-standard.md) governs how implementation work is handed off and reported. Task dispatches govern one milestone and must not silently override this Constitution.

Tests and validators provide evidence about implemented behavior. They do not create editorial permission by themselves. Implementation must conform to the Constitution and the applicable domain contracts.

Normative terms are used deliberately:

- **must** identifies a constitutional requirement;
- **must not** identifies a prohibition;
- **should** identifies a strong default that requires stated reasons and evidence to depart from; and
- **may** identifies permission, not obligation.

## Preamble

PasteLint prepares text before it enters another system, medium, audience, or workflow. Preparation can repair copied text, support revision, adapt reviewed text for speech or publishing, expose risks, and make changes easier to inspect.

Transformation is not justified merely because an output sounds smoother. PasteLint's first responsibility is to improve usefulness without quietly changing the substance or authority of the text.

## Article I — Purpose

PasteLint exists to help people move text from source condition to destination-ready condition with greater clarity, control, and evidence.

Its work may include:

- cleaning accidental formatting and transfer damage;
- repairing structure when the intended boundary is sufficiently supported;
- offering bounded editorial revision;
- preparing reviewed text for speech, publishing, documentation, prompts, email, websites, and other destinations;
- identifying ambiguity, risk, or limitation; and
- explaining observed transformations.

PasteLint is not a generic writing authority, invisible authorship system, AI humanizer, detector-bypass system, or license to replace a writer's claim with generic polish.

## Article II — Editorial duty and user authority

PasteLint must improve text without silently changing what it claims, requires, permits, recommends, implies, attributes, or leaves uncertain.

The user remains the final authority over intended meaning. PasteLint may surface ambiguity, show risks, suggest alternatives, and apply transformations the user selected. It must not pretend to know unstated intent or silently resolve substantive ambiguity.

User authority does not require PasteLint to perform deceptive, harmful, unsupported, or constitutionally prohibited transformations. When safe transformation depends on information the system does not have, it should preserve the source and make the limit visible.

## Article III — Meaning and preservation

Meaning includes more than factual vocabulary. A transformation must account for the relationships that determine what a statement does.

Protected meaning includes, where relevant:

- factual claims and their scope;
- certainty, probability, possibility, and explicit limits of knowledge;
- permission, capability, recommendation, requirement, preference, and prohibition;
- negation, conditions, exceptions, alternatives, and dependencies;
- actor, responsibility, attribution, speaker, and point of view;
- chronology, timing, sequence, deadlines, and duration;
- quantities, names, dates, identifiers, URLs, email addresses, technical values, and catalog or bibliographic identity;
- quotations and the distinction between source language and author language;
- paragraph, line, list, label, and other boundaries when structure carries meaning; and
- accessibility or pronunciation cues required by the destination.

Preservation claims must be bounded by evidence. A regression fixture can prove a tested case; it cannot establish universal semantic understanding. When a boundary is uncertain, conservative preservation is preferable to an unsupported merge, deletion, or rewrite.

## Article IV — Permitted transformation

A transformation is permitted when it serves the selected stage and action, respects protected meaning, and is appropriate to the known destination.

PasteLint may:

- remove accidental formatting noise and repair paste artifacts;
- normalize mechanical forms without damaging protected values;
- clarify syntax through bounded, reviewable rules;
- reduce repetition when the equivalence and removal conditions are supported;
- reorganize structure when the intended relationship is sufficiently clear;
- adapt text for speech, markup, publishing, or another declared destination;
- expose uncertainty, ambiguity, or compatibility risks; and
- offer alternative wording when editorial discretion is explicit and the user retains the choice.

The degree of permissible change depends on the stage, the user's selected action, the destination, and the safeguards available. Permission at one stage does not transfer automatically to another.

## Article V — Prohibited silent transformation

PasteLint must not silently:

- strengthen an uncertain claim or invent confidence;
- weaken an obligation, prohibition, deadline, or condition;
- turn a suggestion or recommendation into a command;
- add persuasive force or urgency absent from the source;
- change who acts, decides, approves, speaks, or bears responsibility;
- alter factual values, quotations, attribution, scope, chronology, or protected identifiers;
- remove qualifications or context necessary to interpret the claim;
- manufacture evidence, provenance, consensus, or sources;
- erase meaningful structure merely for brevity or visual uniformity;
- disguise authorship, imitate a person or style deceptively, or optimize for detector evasion;
- substitute generic polish for the user's purpose or voice; or
- describe a change, completion, or capability that did not occur.

Some transformations may be offered only as explicit alternatives. A substantive reframing, reordered argument, changed tone, compressed summary, or ambiguity resolution requires visible user choice when it could change interpretation. A prohibited transformation does not become acceptable merely because it is labeled as a style improvement.

## Article VI — Uncertainty, force, and claim integrity

Uncertainty is content. Words such as *may*, *might*, *can*, *could*, *probably*, *likely*, *appears*, *suggests*, and *I think*, together with conditional language and explicit knowledge limits, can determine the claim's strength.

Force is also content. Permission, capability, advice, recommendation, preference, invitation, obligation, prohibition, and deadline must remain distinct. Smoother writing does not justify changing *may* to *must*, *should* to an imperative, or a preference into a requirement.

Directness should come from supported framing rather than increased certainty. The established principle is:

> Change the frame. Preserve the claim.

This does not require every qualifier to remain forever. A qualifier may be changed only when a bounded rule or explicit editorial choice preserves the claim it governs. Sometimes the accurate editorial result is no change.

## Article VII — Evidence, provenance, and claims

Evidence precedes narrative. PasteLint must distinguish what was observed from what was concluded.

The system uses a restrained evidence discipline:

- **verified evidence** is directly supported by reproducible behavior, tests, validators, commits, or inspected primary material;
- **source material** includes external publications, user-provided facts, field reports, and captured examples whose origin is identified but whose truth may not be independently established;
- **editorial interpretation or inference** is a reasoned conclusion drawn from stated evidence;
- **hypothesis or speculation** is a possibility requiring further evidence; and
- **unknown** identifies a material gap that must not be filled by invention.

Corroboration can strengthen confidence but does not erase source limitations. Personal recollection and community anecdotes may motivate investigation; they must not be presented as verified trends.

Claims about product behavior must remain within observed implementation and validation. Claims about external practice must remain within the quality and scope of their sources. Limitations, counterexamples, and uncertainty should remain visible wherever they materially affect interpretation.

## Article VIII — Explainability and accountability

Explainability supports review, correction, learning, accessibility, and editorial accountability. It is not decoration or confidence theater.

PasteLint should make meaningful transformations inspectable through appropriate evidence such as findings, status language, edit maps, previews, before-and-after examples, stable rule references, tests, or documented behavior. The level of explanation may vary with the action; not every mechanical character change requires a full essay.

Every explanation must be literally supported by the resulting state. A headline must not contradict its details. A rule reference must not be attached without reliable causation. Preservation and no-change outcomes are legitimate results and should not be disguised as inactivity or failure.

## Article IX — Separation of editorial stages

PasteLint's workflow is **Paste → Clean → Revise → Prepare**. The stages are distinct responsibilities.

### Clean

Clean performs deterministic mechanical cleanup and structural preparation. It repairs transfer and formatting problems. It must not silently choose a tone, summarize meaning, or perform broad editorial judgment.

### Revise

Revise performs bounded editorial transformation involving explicit user choice and review. It may change wording, tone, length, or structure only within its documented authority and safeguards.

### Prepare

Prepare adapts reviewed text for a declared downstream destination, including speech, SSML, publishing, or another structured workflow. It must not quietly revise the claim while satisfying destination constraints.

One stage must not silently perform another stage's responsibility. Transfers between stages should preserve the reviewed text unless a subsequent action is explicit.

## Article X — Privacy and user control

Privacy is part of the editorial relationship. Text entrusted to a preparation tool must not be treated as payment, training material, analytics content, or an undisclosed product input.

User text must not be transmitted to analytics systems. Collection, storage, or remote processing of user text requires an explicit constitutional revision, a clear user-facing purpose, informed choice, and a new privacy and architecture review. Growth or convenience alone is insufficient.

PasteLint's current implementation is browser-only, requires no login or upload, has no backend text-processing service, and uses page and event analytics rather than pasted text. Static hosting and browser-side processing are current architectural expressions of the constitutional commitment to local, controlled preparation; their operational details remain governed by product and privacy documentation.

Users should still be warned against placing confidential or sensitive text in public reports or other external channels. Local processing does not make every surrounding workflow private.

## Article XI — Accessibility

Accessibility is an editorial and design responsibility, not a final compliance label.

PasteLint must preserve meaningful structure and should provide readable hierarchy, semantic markup, keyboard access, visible focus, compatible status communication, and behavior that remains understandable with assistive technologies. Speech preparation must consider pronunciation, pacing, contact information, and structural cues without claiming universal output quality.

A transformation must not make text less comprehensible merely to simplify implementation or appearance. Accessibility claims must remain bounded by actual testing and known support.

## Article XII — Destination-aware preparation

Text changes when it crosses systems. Publishing, prompts, AI workflows, speech synthesis, SSML, IVR, documentation, email, websites, and accessibility tools impose different constraints.

Destination awareness is legitimate when it helps text function in the declared destination without distorting meaning. Material constraints—such as chunk limits, markup compatibility, pronunciation treatment, structural requirements, or unverified vendor behavior—should be visible to the user.

PasteLint must distinguish preparation from execution. Preparing SSML is not generating or validating audio. Cleaning a prompt is not guaranteeing a model result. Publishing preparation is not proof that a claim is true.

## Article XIII — The Journal and knowledge system

The Text Preparation Journal is part of PasteLint's editorial accountability. It records product reasoning, engine behavior, editorial rules, external research, safeguards, limitations, and the path from evidence to conclusion.

Its departments have distinct roles:

- **Engine Room** documents product behavior, verification, and bounded engineering lessons.
- **Editor's Desk** develops practical editorial principles without overstating product authority.
- **Sources & Case Studies** keeps external evidence, observed cases, and interpretation distinguishable.

The Journal must not become generic content marketing, unsupported authority, or retrospective justification for product decisions. Publication is not a condition of shipping verified technical work. The technical and knowledge lanes may proceed independently and reconnect through evidence, documentation, and review.

Only mature, durable, repeatedly supported principles should be elevated into this Constitution. A publication or demonstration does not authorize promotion by itself.

## Article XIV — Research and sources

Research may begin with books, primary documents, practitioner accounts, community discussions, field notes, product failures, search behavior, or observed cases. Source quality and role must remain visible.

One anecdote is not a trend. Community evidence should be labeled as community evidence. Research may inspire a hypothesis without proving it. External evidence and internal engine behavior are different forms of evidence and must not be substituted for one another.

PasteLint must not distort a source to support the product, broaden a source beyond its method or sample, or imply consensus where none was established. Interpretation should name its claim boundary and what evidence could revise it.

## Article XV — Error, correction, and regression

When PasteLint is wrong, correction begins by preserving the source and identifying the failure accurately. The project should distinguish an engine defect, an unsupported claim, a documentation error, and genuine ambiguity in user text.

Verified failures should receive proportionate regression protection when repeatable. Meaningful lessons should be documented in the appropriate technical or knowledge lane. Corrections must remain traceable through focused history and must not quietly rewrite prior evidence or conceal uncertainty.

Not every defect requires public incident reporting. Every correction does require truthful status, bounded claims, and an invalidation check for affected tests, documentation, rules, demonstrations, or publications.

## Article XVI — Product and business constraints

Product and business decisions must preserve editorial integrity.

PasteLint must not trade:

- privacy for growth;
- accuracy for persuasion;
- clarity for engagement;
- user control for invisible automation;
- user text for monetization;
- bounded preparation for generic AI rewriting;
- evidence for unsupported marketing claims; or
- coherent stage responsibilities for feature accumulation.

No specific business model is prescribed. Any future model must respect claim integrity, local control, privacy, accessibility, honest positioning, and the prohibition on humanizer or detector-bypass framing.

## Article XVII — Conflict, interpretation, and amendment

When a feature, document, or practice conflicts with this Constitution, the conflict must be named. Resolution requires repository evidence, explicit reasoning, the narrowest responsible change, and updates to affected authority. There are no silent exceptions.

When principles create tension, preserve meaning, user control, privacy, accessibility, and evidence while minimizing irreversible transformation. If the repository does not resolve a material conflict, work should stop until the decision is made explicitly.

Current implementation may fall short of a constitutional principle. That gap should be documented and prioritized according to risk; it must not be hidden by weakening the principle or overstating present capability.

An amendment requires:

1. the proposed constitutional change;
2. the reason and repository evidence or changed conditions;
3. affected domain documents and implementation surfaces;
4. risks introduced and preservation requirements;
5. treatment of prior decisions and historical context; and
6. one focused, reviewable governance commit.

The Constitution is durable, not frozen. Amendments must change the principle openly rather than creating exceptions through implementation or task dispatches.

## Governance map

1. **Editorial Constitution:** enduring editorial principles and highest editorial authority.
2. **Domain documents:** architecture, workflow, publishing, analytics, engine, component, and QA contracts that operationalize those principles.
3. **Codex Dispatch Standard:** the process for safe implementation handoffs, validation, and reporting.
4. **Task dispatches:** scope and acceptance criteria for one milestone; they cannot silently override higher authority.
5. **Tests and validators:** executable evidence about defined behavior and repository integrity.
6. **Implementation:** the current product expression, which must conform to the applicable principles and contracts.

Narrower documents remain authoritative within their domain unless they conflict with this Constitution. A conflict is resolved explicitly under Article XVII, not by assuming that whichever file changed most recently is correct.

## Operational cross-references

- [README](../README.md): public project identity, current trust model, tools, and development orientation.
- [Workflow v2](workflow-v2.md): technical and knowledge lanes, checkpoints, destinations, and invalidation.
- [Engine Architecture](engine-architecture.md): current stage boundaries, safeguards, limitations, and data flow.
- [SecondDraft Editorial Rulebook](second-draft-editorial-rulebook.md): rule metadata, preservation constraints, and bounded revision governance.
- [Editorial Components v1](editorial-components-v1.md): evidence presentation, provenance, accessibility, and component lifecycle.
- [Editorial Knowledgebase Map](editorial-knowledgebase-map.md): observed product rules and knowledge organization.
- [Journal Publication Identity](journal-publication-identity.md): authorship, publication dates, sharing, analytics, and validator contract.
- [QA Checklist](../QA_CHECKLIST.md): operational regression and browser verification.
- [Codex Dispatch Standard](codex-dispatch-standard.md): repository rehydration, scope, validation, and implementation returns.

These documents contain operational detail that this Constitution deliberately does not duplicate.
