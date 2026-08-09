# PasteLint Editorial Canon

## Status and authority

**Status:** Internal editorial reference, version 1.

**Scope:** Durable principles supported by the published Text Preparation Journal.

This Canon records the intellectual foundation the Journal has established across Editor's Desk, Engine Room, and Sources & Case Studies. It is a publication-derived reference: articles supply evidence, observations, investigations, and implementation records; the Canon identifies the principles that remain useful when individual examples or implementations change.

The [Editorial Constitution](editorial-constitution.md) remains PasteLint's highest editorial authority. This Canon does not amend, replace, or outrank it. Where the Constitution states what PasteLint must preserve, this document shows which durable principles the published Journal currently reinforces. A conflict is resolved in favor of the Constitution until a dedicated governance milestone changes that authority explicitly.

The Canon is not a public Journal page, an article index, a product-capability inventory, or a substitute for source review. Inclusion does not convert a bounded article claim into a universal claim.

## Canon method

A principle belongs here only when it is:

- stated or repeatedly reinforced by published Journal material;
- durable beyond one implementation, source, or interface;
- narrower than or equal to the evidence supporting it;
- materially distinct from the other principles; and
- useful to an editor, author, researcher, designer, or maintainer making a future decision.

Statuses are used conservatively:

- **Core:** supported across multiple publications, departments, or independent forms of evidence.
- **Emerging:** clearly present in the published record but supported by fewer independent investigations or a narrower evidence base.
- **Candidate:** excluded from the Canon until the published record provides enough support. Candidate ideas appear only in the separate recommendations section.

## Canonical principles

### EC-0001 — Destination Readiness

**Statement:** Text is not ready in the abstract. It is ready for a particular destination whose audience, medium, system, and constraints determine the required preparation.

**Why it matters:** A polished draft can still fail when it enters speech, publishing, documentation, email, a prompt, or another editorial stage without the checks that destination requires.

**Supported by:**

- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)
- Sources & Case Studies: [The Content Pipeline Breaks Before the Writing Does](../journal-content-pipeline-breaks-before-writing.html), [Tracing Changes the Conditions Around the Output](../journal-tracing-with-the-model.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)

**Status:** Core

### EC-0002 — Handoff Discipline

**Statement:** Every transition between evidence, draft, review, system, medium, or audience is a handoff. Each handoff deserves deliberate preparation and an explicit acceptance boundary.

**Why it matters:** Many preventable failures occur between stages even when the writing at the prior stage was competent.

**Supported by:**

- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)
- Sources & Case Studies: [The Content Pipeline Breaks Before the Writing Does](../journal-content-pipeline-breaks-before-writing.html), [Tracing Changes the Conditions Around the Output](../journal-tracing-with-the-model.html)
- Engine Room: [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html)

**Implemented by:** [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html)

**Status:** Core

### EC-0003 — Meaning Preservation

**Statement:** Preparation must not silently change what text claims, requires, permits, recommends, attributes, implies, or leaves uncertain. Form may adapt to a destination only while the supported meaning remains intact.

**Why it matters:** A smoother, shorter, more direct, or more compatible version can still be editorially worse if it changes the substance of the communication.

**Supported by:**

- Editor's Desk: [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html), [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)
- Sources & Case Studies: [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Status:** Core

### EC-0004 — Uncertainty Is Content

**Statement:** Possibility, probability, judgment, permission, capability, and explicit limits of knowledge are part of a claim. Editing must not remove or strengthen them merely to create a firmer voice.

**Why it matters:** Removing a small qualifier can turn an assessment into a fact, a possible outcome into a certainty, or permission into capability.

**Supported by:**

- Editor's Desk: [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Status:** Core

### EC-0005 — Force and Responsibility Preservation

**Statement:** Suggestions, recommendations, requests, permissions, obligations, prohibitions, and commands are not interchangeable. Revision must preserve who acts, who decides, and how strongly an action is proposed.

**Why it matters:** A concise edit can quietly change responsibility or increase the authority of the sentence beyond the source.

**Supported by:**

- Editor's Desk: [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Status:** Core

### EC-0006 — Structure Carries Meaning

**Statement:** Meaning can reside in line boundaries, grouping, sequence, labels, signoffs, records, and other visible relationships, not only in words. Structural preservation is therefore an editorial requirement when those relationships matter or remain uncertain.

**Why it matters:** A transformation can preserve every word while damaging how the document is interpreted, reviewed, or spoken.

**Supported by:**

- Engine Room: [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html), [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html)
- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)

**Implemented by:** [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html), [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html)

**Status:** Core

### EC-0007 — Reviewable Change

**Statement:** Meaningful edits should remain visible enough for a person to compare, understand, accept, reject, or revise them. A polished result is not a substitute for an inspectable change.

**Why it matters:** Reviewability protects authorship, makes tradeoffs legible, and allows correction before transformed text reaches its destination.

**Supported by:**

- Sources & Case Studies: [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html)
- Editor's Desk: [The Record Behind Product Transparency](../journal-editors-desk-record-behind-product-transparency.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Evidence:** [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html)

**Status:** Core

### EC-0008 — Preservation Is a Successful Outcome

**Statement:** No change can be the correct editorial result. A system or editor should preserve text when a proposed transformation lacks sufficient authority or would damage meaning, structure, voice, or evidence.

**Why it matters:** Measuring quality by visible change rewards unnecessary intervention and conceals the value of restraint.

**Supported by:**

- Editor's Desk: [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Status:** Core

### EC-0009 — Evidence Before Narrative

**Statement:** Observation, source material, verified behavior, inference, and unknowns must remain distinguishable. Explanation may organize evidence, but it must not outrun it.

**Why it matters:** A coherent story can create false confidence when its evidence quality, source role, or unresolved questions are hidden.

**Supported by:**

- Editor's Desk: [The Record Behind Product Transparency](../journal-editors-desk-record-behind-product-transparency.html)
- Sources & Case Studies: [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html)
- Engine Room: [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Evidence:** [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)

**Status:** Core

### EC-0010 — Bounded Claims

**Statement:** A claim must stop where its evidence stops. A fixture, case, community report, practitioner account, or observed implementation supports only the scope it actually establishes.

**Why it matters:** Narrow evidence becomes misleading when presented as universal capability, consensus, causation, or guaranteed outcome.

**Supported by:**

- Sources & Case Studies: [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)
- Editor's Desk: [The Record Behind Product Transparency](../journal-editors-desk-record-behind-product-transparency.html)

**Status:** Core

### EC-0011 — Editorial Judgment Before Automation

**Statement:** Automation may assist construction, cleanup, comparison, or preparation, but editorial judgment determines what deserves attention, what should change, and what counts as acceptable for the destination.

**Why it matters:** Faster production does not resolve questions of hierarchy, meaning, evidence, authorship, proportion, or purpose.

**Supported by:**

- Sources & Case Studies: [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html), [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)
- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)

**Evidence:** [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html), [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html)

**Status:** Core

### EC-0012 — Preparation Is Not Execution

**Statement:** Preparing text for a system does not prove the system's result. A prompt does not guarantee a model response, SSML does not validate final audio, and publication preparation does not establish factual truth or reader comprehension.

**Why it matters:** Honest boundaries prevent preparation tools and editorial processes from claiming outcomes they cannot observe.

**Supported by:**

- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)
- Sources & Case Studies: [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [Tracing Changes the Conditions Around the Output](../journal-tracing-with-the-model.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)

**Status:** Core

### EC-0013 — Distinct Stages Carry Distinct Permissions

**Statement:** Intake, cleanup, revision, verification, and destination preparation are different editorial responsibilities. Authority to perform one stage does not silently authorize another.

**Why it matters:** Stage collapse allows mechanical cleanup to become rewriting, preparation to become unsupported approval, or a style preference to become a change in meaning.

**Supported by:**

- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html), [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html)
- Sources & Case Studies: [Tracing Changes the Conditions Around the Output](../journal-tracing-with-the-model.html), [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Status:** Core

### EC-0014 — Constraints Are Editorial Information

**Statement:** Character limits, chunk boundaries, markup rules, pronunciation needs, line topology, and other destination constraints can affect meaning and review. They must be treated as editorial information rather than invisible technical cleanup.

**Why it matters:** A technically valid transformation can separate related material, damage structure, or make the result harder to verify.

**Supported by:**

- Engine Room: [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)
- Editor's Desk: [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)

**Implemented by:** [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Status:** Core

### EC-0015 — Revision Is Retrospective Alignment

**Statement:** Revision applies knowledge discovered during drafting, comparison, collaboration, and production back across the work. It is not merely sentence polishing after composition ends.

**Why it matters:** Later understanding can reveal that an early choice, structure, emphasis, or premise no longer serves the work that emerged.

**Supported by:**

- Sources & Case Studies: [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html), [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html), [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html)

**Evidence:** [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html)

**Status:** Emerging

### EC-0016 — Supported Participation Over Output Maximization

**Statement:** When learning, authorship, or judgment is part of the objective, a useful process should preserve meaningful participation rather than maximize finished output or obstruction. Explanation, retrieval, choice, feedback, and another attempt may be more appropriate than immediate completion.

**Why it matters:** Producing fluent text can displace the activity through which a person learns, decides, or retains ownership, while refusal alone can create an unproductive dead end.

**Supported by:**

- Sources & Case Studies: [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html), [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html)

**Evidence:** [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html)

**Status:** Emerging

**Notes:** The evidence does not establish one universal tutor interface, learning outcome, or authorship-preservation method.

### EC-0017 — Restraint Directs Attention

**Statement:** Editorial quality depends partly on deciding what not to add, emphasize, rewrite, or automate. Removing empty framing and preserving useful material are both acts of directing attention.

**Why it matters:** Visible activity can make text or interfaces busier without making their purpose easier to find.

**Supported by:**

- Editor's Desk: [Filler Openings Make AI Drafts Feel Unfinished](../journal-editors-desk-filler-openings.html), [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html)
- Sources & Case Studies: [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html)

**Status:** Core

### EC-0018 — The Editorial Record Must Survive the Implementation

**Statement:** Durable editorial reasoning should connect decisions to evidence, tradeoffs, tests, uncertainty, correction, and known limits. The record must remain understandable after an implementation, source, or contributor changes.

**Why it matters:** Without an inspectable record, safeguards become folklore, limitations disappear, and future decisions lose the context needed for correction.

**Supported by:**

- Editor's Desk: [The Record Behind Product Transparency](../journal-editors-desk-record-behind-product-transparency.html), [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html)
- Engine Room: [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)
- Sources & Case Studies: [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html), [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html)

**Implemented by:** [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html), [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html)

**Status:** Core

## Published article to Canon mapping

This mapping identifies which principles each publication reinforces. It is not an article summary and does not replace the article's evidence, claim boundary, or department role.

| Published article | Department | Canonical principles reinforced |
| --- | --- | --- |
| [The Cleanup Pass Is Where Voice Survives](../journal-cleanup-pass-voice-survives.html) | Sources & Case Studies | EC-0003 Meaning Preservation; EC-0007 Reviewable Change; EC-0013 Distinct Stages Carry Distinct Permissions; EC-0015 Revision Is Retrospective Alignment; EC-0016 Supported Participation Over Output Maximization |
| [The Content Pipeline Breaks Before the Writing Does](../journal-content-pipeline-breaks-before-writing.html) | Sources & Case Studies | EC-0001 Destination Readiness; EC-0002 Handoff Discipline |
| [Tracing Changes the Conditions Around the Output](../journal-tracing-with-the-model.html) | Sources & Case Studies | EC-0001 Destination Readiness; EC-0002 Handoff Discipline; EC-0012 Preparation Is Not Execution; EC-0013 Distinct Stages Carry Distinct Permissions |
| [Filler Openings Make AI Drafts Feel Unfinished](../journal-editors-desk-filler-openings.html) | Editor's Desk | EC-0017 Restraint Directs Attention |
| [Clearer Is Not More Certain](../journal-editors-desk-clearer-is-not-more-certain.html) | Editor's Desk | EC-0003 Meaning Preservation; EC-0004 Uncertainty Is Content; EC-0005 Force and Responsibility Preservation; EC-0008 Preservation Is a Successful Outcome; EC-0013 Distinct Stages Carry Distinct Permissions; EC-0017 Restraint Directs Attention |
| [Directness Without False Certainty](../journal-engine-room-directness-without-false-certainty.html) | Engine Room | EC-0003 Meaning Preservation; EC-0004 Uncertainty Is Content; EC-0005 Force and Responsibility Preservation; EC-0007 Reviewable Change; EC-0008 Preservation Is a Successful Outcome; EC-0010 Bounded Claims; EC-0013 Distinct Stages Carry Distinct Permissions; EC-0017 Restraint Directs Attention; EC-0018 The Editorial Record Must Survive the Implementation |
| [Preserving Catalog Records Across SSML Chunks](../journal-engine-ssml-catalog-chunks.html) | Engine Room | EC-0002 Handoff Discipline; EC-0006 Structure Carries Meaning; EC-0014 Constraints Are Editorial Information |
| [The New Bottleneck Isn’t Code—It’s Taste](../journal-sources-case-studies-the-new-bottleneck-is-taste.html) | Sources & Case Studies | EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0011 Editorial Judgment Before Automation; EC-0015 Revision Is Retrospective Alignment; EC-0017 Restraint Directs Attention |
| [The First Draft Finds the Story. Revision Makes It Work.](../journal-sources-case-studies-first-draft-finds-the-story.html) | Sources & Case Studies | EC-0007 Reviewable Change; EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0011 Editorial Judgment Before Automation; EC-0015 Revision Is Retrospective Alignment; EC-0016 Supported Participation Over Output Maximization |
| [A Tutor Prompt Is More Than a Refusal](../journal-sources-case-studies-tutor-not-ghostwriter.html) | Sources & Case Studies | EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0011 Editorial Judgment Before Automation; EC-0012 Preparation Is Not Execution; EC-0016 Supported Participation Over Output Maximization; EC-0018 The Editorial Record Must Survive the Implementation |
| [Line Breaks Are Part of the Meaning](../journal-engine-room-line-breaks-are-part-of-the-meaning.html) | Engine Room | EC-0003 Meaning Preservation; EC-0006 Structure Carries Meaning; EC-0008 Preservation Is a Successful Outcome; EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0014 Constraints Are Editorial Information; EC-0018 The Editorial Record Must Survive the Implementation |
| [The Record Behind Product Transparency](../journal-editors-desk-record-behind-product-transparency.html) | Editor's Desk | EC-0007 Reviewable Change; EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0018 The Editorial Record Must Survive the Implementation |
| [Editors Optimize for Readers. Humanizers Optimize for Detectors.](../journal-sources-case-studies-editors-optimize-for-readers.html) | Sources & Case Studies | EC-0001 Destination Readiness; EC-0009 Evidence Before Narrative; EC-0010 Bounded Claims; EC-0011 Editorial Judgment Before Automation; EC-0012 Preparation Is Not Execution; EC-0018 The Editorial Record Must Survive the Implementation |
| [Text Readiness Is a Handoff Discipline](../journal-editors-desk-text-readiness-is-a-handoff-discipline.html) | Editor's Desk | EC-0001 Destination Readiness; EC-0002 Handoff Discipline; EC-0003 Meaning Preservation; EC-0006 Structure Carries Meaning; EC-0011 Editorial Judgment Before Automation; EC-0012 Preparation Is Not Execution; EC-0013 Distinct Stages Carry Distinct Permissions; EC-0014 Constraints Are Editorial Information; EC-0018 The Editorial Record Must Survive the Implementation |

## Principles not yet ready for Canon

These are recommendations for future evidence gathering, not canonical principles.

### Accessibility as destination evidence

The Constitution treats accessibility as an editorial responsibility, and several publications mention speech, structure, or cognitive support. The Journal does not yet contain a dedicated investigation with direct accessibility evidence, testing, limitations, and counterexamples sufficient for a distinct publication-derived Canon principle.

**Evidence needed:** an Engine Room verification record or Sources & Case Studies investigation showing how a specific preparation choice affects assistive use, with tested boundaries and user-impact evidence.

### Privacy as an editorial relationship

The product and Constitution establish a strong privacy position, but the published Journal has not yet examined privacy as a durable editorial principle in its own right.

**Evidence needed:** a source-backed or implementation-backed investigation into how text custody, analytics boundaries, or local processing affects editorial trust and user control.

### Correction as publication practice

The public record article values correction, and the Constitution defines correction duties. The Journal has not yet documented a mature publication correction, retraction, supersession, or evidence-revision case.

**Evidence needed:** a real correction cycle preserving the original claim, changed evidence, editorial decision, and resulting update without retrospective concealment.

### Provenance across stage transfers

Several articles support handoff discipline and evidence preservation, but the published record does not yet establish a mature, general standard for how provenance should travel when text moves between tools, editors, or destinations.

**Evidence needed:** verified transfer behavior or an external case showing what provenance must remain visible, when it may expire, and how it affects review.

### Emotional composure as an editorial outcome

The Journal's voice is calm and restrained, but tone alone does not establish composure as a canonical outcome of interface feedback or editorial preparation.

**Evidence needed:** a dedicated investigation connecting truthful status, recovery, control state, and user understanding to a defensible account of composure.

## Maintenance and promotion

- Add or revise a principle only through a focused governance change.
- Require at least one published supporting article and prefer support across multiple departments or independent evidence forms before assigning Core status.
- Do not promote a knowledge-ledger candidate automatically because `canonPromotionCandidate` is true.
- When a supporting article is corrected, retired, or materially narrowed, review every Canon principle and mapping row that cites it.
- Merge principles when their decision value is materially the same. Do not preserve duplicate concepts merely to retain IDs.
- Keep IDs stable after adoption. If a principle is superseded, record the replacement rather than silently reusing its ID.
- Treat the article mapping as traceability, not proof. The supporting publication remains the source for evidence and limitations.
- Amend the Editorial Constitution separately when a principle is approved for highest-level normative authority.

## Version record

- **Version 1 — 2026-08-09:** Established 18 publication-supported principles, mapped all 14 published Journal articles, and separated five insufficiently supported future principles from the Canon.
