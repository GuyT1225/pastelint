# Second Draft tone-separation and safety audit

**Audit date:** July 28, 2026  
**Baseline:** `5d0fb2e` — `feat: add Journal sharing and publication identity`  
**Scope:** Read-only audit and fixture design. No engine, UI, registry, test, or public-documentation behavior changed.

## Executive finding

Second Draft does not currently have five independent tone engines. It has a shared deterministic cleanup layer, a shared `focusedMode` layer used by Concise, Direct, and Shorter, two broad vocabulary-swap layers for Professional and Friendly, and a narrower Direct-only request layer. Length and Reflow then operate after tone processing, but unconditional final cleanup can also change line structure.

Direct is the most mature tone lane because its supported request, modality, recommendation, timing, and protected-value behavior has dedicated fixtures. Professional is the least safe: its whole-word synonym substitutions create common ungrammatical collocations. Concise is only selectively distinct from Natural and often duplicates Direct or Shorter. Friendly usually makes no change, but its reverse synonym substitutions can change obligation wording. Natural is the absence of tone-specific phrase rules, not the absence of revision.

No Critical meaning, actor, negation, condition, or protected-value failure was reproduced in the tested sentence fixtures. High-severity grammar and structure failures were reproduced.

## Controls and current pipeline

The UI values are:

- Tone: `natural`, `concise`, `professional`, `friendly`, `direct`
- Length: `same`, `shorter`, `expand`
- Structure: `reflow` false or true

`reviseSecondDraft()` executes in this order:

| Order | Function or stage | Conditions and inputs | Rule IDs | Reporting and risk |
| --- | --- | --- | --- | --- |
| 1 | `normalizeSecondDraftText(text)` | Unconditional | None | Normalizes spaces, punctuation, blank-line runs, and capitalization. Not separately represented in `edits`. |
| 2 | `applySecondDraftPatternRules()` | All options | See below | Notification frames run for every tone. `focusedMode` is Direct, Concise, or Shorter. Direct request rules run only for Direct. |
| 3 | `rewriteSecondDraftNotificationFrames()` | Unconditional | `SD-CLARITY-001` | Complete notification-frame rewrites are reported immediately. |
| 4 | Shared filler/opening patterns | Some unconditional; others focused | `SD-CLARITY-001`, `SD-COMPRESSION-001`, `SD-REPETITION-001`; timing pattern has no ID | Direct and Shorter can turn one supported filler frame into an action; Natural and other lanes retain a statement. |
| 5 | Main-point recommendation rewrite | `focusedMode` | None | Deferred until its replacement survives final output. Preserves `we should`. |
| 6 | Direct hesitant-request rewrite | Direct only | `SD-CLARITY-002` | Deferred verification; finite complete frames only. |
| 7 | `applySecondDraftPhraseRules()` | Shared list for every tone, then Professional or Friendly additions | Shared compression phrases may use `SD-COMPRESSION-001`; most have no ID | Professional/Friendly use case-sensitive whole-word substitutions. Edits are not deferred or reverified. |
| 8 | `applySecondDraftLengthRules()` | Shorter or Expand | Exact repetition uses `SD-REPETITION-002`; other length behavior has no ID | Shorter deletes fixed filler tokens and exact normalized sentence repeats. Expand inserts fixed sentences. Both use synthetic edit-map records for broad changes. |
| 9 | `reflowSecondDraftParagraphs()` | Reflow enabled | `SD-STRUCTURE-001` only when paragraph count changes | Treats every non-empty source line as a paragraph. |
| 10 | `cleanupSecondDraftSentenceFlow()` | Unconditional | None | Runs per blank-line-delimited paragraph and collapses all remaining whitespace, including single newlines. Can change lists/signatures without an edit record. |
| 11 | Final `normalizeSecondDraftText()` | Unconditional | None | May alter punctuation, spacing, capitalization, and blank-line runs after recorded edits. |
| 12 | Deferred verification | Pending Direct and main-point edits | Direct ID where applicable | Adds only pending edits whose exact replacement remains present. |
| 13 | Change and edit-map output | Unconditional | Deduplicates changes and rule matches | `changes` supplies “Why it works”; `edits` supplies “What changed”; `ruleMatches` remains internal. |

Later length and cleanup stages can change text after ordinary pattern/phrase edits were recorded. Only the main-point and Direct hesitant-request paths use final-output verification.

## Current tone implementation map

### Natural

Natural adds no tone-specific phrase rules. It still receives notification rewriting, unconditional filler and phrase cleanup, length behavior, optional reflow, and final normalization.

### Concise

Concise activates `focusedMode`. It receives the same known weak-phrasing, repetition, main-point, and timing rewrites as Direct and Shorter. It has no separate phrase list and does not automatically activate the Shorter length pass.

### Professional

Professional adds these exact case-sensitive whole-word substitutions:

- `a lot of` → `many`
- `get` → `receive`
- `help` → `assist`
- `need` → `require`
- `show` → `demonstrate`

They have no rule IDs and no grammar or collocation conditions.

### Friendly

Friendly adds the reverse substitutions:

- `receive` → `get`
- `assist` → `help`
- `require` → `need`
- `demonstrate` → `show`

They have no rule IDs. Friendly does not add greetings, warmth, contractions, enthusiasm, punctuation, or relationship language.

### Direct

Direct activates `focusedMode`, uses a distinct timing replacement (`Tell me` rather than `Let me know`), supports a narrow “I think there are…” rewrite, and runs the finite hesitant-request matcher. Current regression-backed behavior preserves tested modality, recommendation strength, actors, conditions, timing, and protected values. Unsupported wording can remain unchanged.

## Working tone contracts

### Natural

Preserve voice and formality while removing mechanical or clearly disposable wording. Make the fewest tone-driven changes. Do not add warmth, authority, urgency, certainty, obligation, elevated vocabulary, or content.

### Concise

Reduce verbal overhead while retaining the same action, courtesy, conditions, alternatives, evidence, deadlines, and certainty. Do not become Direct or merely duplicate Shorter.

### Professional

Use clear, precise, neutral workplace language. Clarify purpose, responsibility, timing, and stable courtesy without vocabulary inflation. Do not apply thesaurus substitutions, break collocations, add authority, or modify protected terms.

### Friendly

Reduce unnecessary stiffness while preserving boundaries, facts, relationship level, deadlines, and request strength. Do not invent warmth, enthusiasm, familiarity, emojis, exclamation marks, or optionality.

### Direct

Make a supported action or central statement explicit while preserving meaning, modality, recommendation strength, responsibility, timing, courtesy, and conditions. Keep it finite and explainable.

## Tone versus Length

Tone describes interpersonal/editorial presentation. Length describes how much wording remains. The implementation only partially separates them:

- Concise and Direct share `focusedMode`.
- Shorter also activates `focusedMode`, even under Natural, Professional, or Friendly.
- Concise + Keep similar can be identical to Direct + Keep similar on focused patterns.
- Natural + Shorter can be identical to Concise + Keep similar.
- Shorter additionally removes fixed filler tokens and later exact normalized sentence repetitions.
- Expand applies the same additions under every tone; its behavior is not tone-specific.

## Execution method and fixture catalog

A read-only Node VM loaded the production `js/second-draft.js` unchanged and invoked the real `reviseSecondDraft()` function. The harness captured output, changes, edits, rule matches, character/word counts, lines, and paragraphs. It was not written into the repository.

Primary fixtures were run through all 30 Tone × Length × Reflow combinations. High-volume single-sentence categories used Tone × Keep similar because the relevant phrase matcher is independent of Length and Reflow. Structure fixtures used every Tone × Reflow combination. Expand fixtures used every tone with Expand. Stable fixture IDs:

| ID | Category |
| --- | --- |
| `TONE-AUDIT-001` | User-supplied OTBS/workplace lines |
| `TONE-AUDIT-002`–`011` | Professional collocations |
| `TONE-AUDIT-012`–`017` | Friendly preservation |
| `TONE-AUDIT-018` | Concise/Direct/Shorter workplace email |
| `TONE-AUDIT-019` | Modality and certainty |
| `TONE-AUDIT-020` | Actor and responsibility |
| `TONE-AUDIT-021` | Timing and protected values |
| `TONE-AUDIT-022` | Lists, labels, fragments, and signatures |
| `TONE-AUDIT-023` | Negation and conditions |
| `TONE-AUDIT-024` | Expand grounding |
| `TONE-AUDIT-025` | Focused-mode overlap |
| `TONE-AUDIT-026`–`027` | Cascaded edit-map accuracy |

## Findings

### High

#### `TONE-FINDING-001` — Professional breaks common collocations

- **Fixtures:** `TONE-AUDIT-002`–`009`, `020`, `026`
- **Controls:** Professional + Keep similar + Reflow off
- **Exact outputs:** `Let's receive started tomorrow.`, `Please receive back to me by Friday.`, `We require to review the agreement.`, `This will assist explain the change.`, `Please demonstrate the team the revised schedule.`, `I can assist prepare the final version.`, `The vendor may require to regenerate the audio.`
- **Invariant:** Workplace grammar and source meaning must remain intact.
- **Cause:** Unconditional `get/help/need/show` substitutions in `applySecondDraftPhraseRules()`.
- **Rule coverage:** No rule ID.
- **Edit map:** Reports the literal swap, but does not warn that the resulting construction is invalid.
- **Future action:** Remove or constrain the substitutions before adding any Professional behavior.
- **Regression recommendation:** Preserve each source sentence exactly unless a bounded sentence pattern is approved.

#### `TONE-FINDING-002` — Unconditional cleanup flattens lists and signatures

- **Fixtures:** `TONE-AUDIT-001`, `018`, `021`, `022`
- **Controls:** Every tone + Keep similar + Reflow off
- **Exact output example:** `Project checklist - Calendar feeds - Event links 1. Confirm dates 2. Review titles Owner: Rebecca Deadline: September 1 Thanks, Guy`
- **Invariant:** Reflow off must not silently remove meaningful single line breaks.
- **Cause:** `cleanupSecondDraftParagraphFlow()` ends with `\s+` → one space inside each blank-line-delimited paragraph.
- **Rule coverage:** None.
- **Edit map:** No edit or visible change is reported.
- **Future action:** Address in a separate structure-preservation cycle; do not mix it into Professional.
- **Regression recommendation:** Bullets, numbered items, label/value lines, intentional fragments, and signatures.

### Medium

#### `TONE-FINDING-003` — Reflow treats every non-empty line as a paragraph

Reflow preserves exact tokens but turns headings, bullets, labels, `Thanks,`, and `Guy` into separate paragraphs. This is truthful according to the current documented implementation, but unsafe for indiscriminate use on structured text. `SD-STRUCTURE-001` is reported when paragraph count changes.

#### `TONE-FINDING-004` — Expand inserts ungrounded meta-commentary

- `The schedule is ready.` becomes `The schedule is ready. This gives the reader a little more context while preserving the original meaning.`
- A short first sentence receives `This helps frame the main point more clearly.`

These additions are harmless but unearned generic framing, not grounded paraphrase. They claim clarity or preservation rather than adding source-supported context. Behavior and synthetic edit map have no rule ID.

#### `TONE-FINDING-005` — Expand can claim expansion without adding content

On `TONE-AUDIT-001`, Expand joined line structure but added no words, yet reported `Expanded the draft slightly...` and recorded `Shorter draft` → `Slightly fuller draft`. This is misleading reporting.

#### `TONE-FINDING-006` — Concise, Direct, and Shorter substantially overlap

`There are a few areas where the wording could be improved.` becomes `The wording could be clearer.` identically under Concise + Same, Direct + Same, and Natural + Shorter. The filler-repetition and main-point fixtures behave the same way. Only Direct's finite request patterns, `I think there are...` pattern, and `Tell me` timing variant distinguish it on this set.

#### `TONE-FINDING-007` — Edit maps can describe intermediates or placeholders

Professional turns `assistance` → `help` → `assist`, leaving the first edit's `after` absent from final output. Shorter uses `Wordier phrasing` → `Shorter phrasing`; Expand uses `Shorter draft` → `Slightly fuller draft`. These are not exact before/after evidence. Ordinary phrase edits are not reverified after later stages.

#### `TONE-FINDING-008` — Friendly can alter obligation vocabulary

`This may require legal review before publication.` becomes `This may need legal review before publication.` The modal remains, but `require` and `need` are not universally interchangeable in policy, technical, or contractual contexts. The swap has no sentence condition or rule ID.

### Low

#### `TONE-FINDING-009` — Natural, Concise, Friendly, and Direct can be indistinguishable

The realistic workplace email remained identical under Natural, Concise, and Direct with Keep similar. Friendly also made no change. This is safe but provides weak tone differentiation.

#### `TONE-FINDING-010` — Tone phrase matching is case- and form-sensitive

The literal lowercase `show` rule does not change `shows`; sentence-initial variants may not match. This limits damage but makes tone behavior inconsistent and difficult to explain as a general capability.

### Critical

None reproduced. Tested actors, negation, conditions, core modality, URLs, dates, email, phone, DB number, Option 3, SSML, OTBS, and capitalization survived exactly.

## Representative results

### User-supplied fixture

With Reflow off, every tone collapsed the five single lines into one line. No tone invented an opening request, removed either requested item, or changed the optional call. With Reflow on, every source line became a separate paragraph, including `Thanks,` and `Guy`. Expand sometimes joined `Thanks,` to the preceding sentence while still reporting expansion.

### Professional collocations

Seven of ten required fixtures produced a broad substitution; six were clearly ungrammatical. `The group will receive access after approval.` and `Please receive the files...` are grammatical but unnecessary. `The report shows...` remained unchanged because `show` does not match `shows`.

### Friendly preservation

Five of six required fixtures remained exact. The `require` fixture changed to `need`. No enthusiasm, punctuation, actor, deadline, negation, or familiarity was added.

### Concise versus Direct versus Shorter

On the realistic email, Natural, Concise, and Direct with Keep similar were identical. All three Shorter combinations were also identical and retained every word, but Shorter collapsed paragraph/signature structure and claimed tightening. Focused fixtures demonstrate real Concise behavior, but it is shared with Direct and Shorter.

### Modality, actors, conditions, and protected values

The combined `may/might/could/should/probably/appears/seems/likely/recommend/suggest/must/cannot` fixture was exact under all five tones. Actor fixtures were exact except Professional's ungrammatical `may require to regenerate`. All required `not/only/until/unless/if/optional` tokens survived. Protected values survived exactly, including both time abbreviations and the URL query string.

## Interaction matrix summary

| Interaction | Natural | Concise | Professional | Friendly | Direct |
| --- | --- | --- | --- | --- | --- |
| Keep similar on ordinary workplace prose | Usually unchanged except shared cleanup | Often same as Natural | Broad literal swaps when matched | Reverse literal swaps when matched | Often unchanged outside finite patterns |
| Focused patterns | No | Yes | No, unless Shorter | No, unless Shorter | Yes |
| Shorter | Adds focused patterns, filler deletion, exact repetition | Same plus Concise overlap | Professional swaps then Shorter | Friendly swaps then Shorter | Direct patterns then Shorter |
| Expand | Fixed generic additions | Same | Professional swaps then same additions | Friendly swaps then same additions | Direct patterns then same additions |
| Reflow off | Single newlines can still collapse | Same | Same | Same | Same |
| Reflow on | Every non-empty line becomes a paragraph | Same | Same | Same | Same |

## Tone scorecard

| Tone | Distinctness from Natural | Distinctness from Length | Grammar safety | Semantic/modality/actor/condition safety | Courtesy | Lists/signatures | Protected values | Edit-map accuracy | Workplace usefulness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Natural | Weak | Adequate | Adequate | Strong on tested sentences | Strong | Unsafe | Strong | Weak for normalization | Adequate |
| Concise | Adequate on exact patterns | Weak | Adequate | Strong on tested patterns | Adequate | Unsafe | Strong | Adequate for pattern edits | Adequate but narrow |
| Professional | Strong when swaps fire | Adequate | Unsafe | Weak because grammar/collocation can change | Adequate | Unsafe | Strong | Weak | Unsafe |
| Friendly | Weak | Adequate | Adequate | Adequate; obligation wording needs limits | Strong on tested fixtures | Unsafe | Strong | Adequate for literal swaps | Weak |
| Direct | Strong on supported requests | Adequate | Strong on regression-backed patterns | Strong on tested sentences | Adequate | Unsafe from shared cleanup | Strong | Strong for deferred Direct edits; weaker globally | Strong within finite scope |

## Existing and missing rule coverage

Existing IDs accurately cover known filler openings, supported Direct requests, known compression, filler repetition, exact repeated sentences, truthful reflow, advisory long-sentence review, and the general preservation principle.

No implemented rule ID covers:

- Professional vocabulary substitutions
- Friendly reverse substitutions
- Timing-question tightening
- Main-point announcement removal
- Shorter's general filler-token deletion
- Expand additions
- Unconditional single-line collapse
- Synthetic length edit-map records

Do not assign existing narrow IDs to these broader concepts. A new ID is warranted only after a durable bounded behavior is approved and implemented.

## Protected invariants for future work

- Preserve actors, approvers, senders, decision makers, and conditions.
- Preserve modality, certainty, recommendation strength, prohibition, optionality, deadlines, and courtesy.
- Preserve URLs including queries, email, phone, dates, times, DB numbers, menu options, titles, acronyms, signatures, lists, and label/value pairs.
- Reflow off must not authorize structural flattening.
- Every reported edit should correspond to final-output evidence.
- Tone selection must not silently activate a Length promise; Length selection must not silently redefine tone.

## Professional implementation brief

### Design principle

Professional means making workplace purpose, request, responsibility, timing, and courtesy clear without changing the claim or inflating vocabulary. It does not mean selecting a longer synonym.

### Current Professional-only behavior to constrain

Remove or tightly constrain all five literal categories: `a lot of`, `get`, `help`, `need`, and `show`. The ordinary source words are already professional in common constructions such as `get started`, `get back to me`, `need to review`, `help explain`, `help prepare`, `show the team`, and `get the files`.

### Safe future categories to evaluate

- Exact distinctly casual filler frames, only at eligible sentence boundaries
- Bounded request organization that retains stable `Please`
- Clear actor/action/timing ordering without changing words that carry force
- Narrow slang replacements where the complete construction is known
- Intentional no-change results when the source is already clear workplace prose

Do not add a synonym dictionary, probabilistic rewrite, API, or style model.

### Required regression fixtures

Adopt `TONE-AUDIT-002`–`011`, `020`, `026`, and the Friendly/Natural/Direct unchanged controls. Add uppercase and inflected forms as negative fixtures. Assert exact output, changes, edits, rule matches, and absence of malformed collocations.

### Rule-ID decision

No new rule ID is required merely to remove unsafe substitutions. If a new durable sentence-level Professional concept is later approved, add a new stable ID rather than reusing `SD-CLARITY-001` or `SD-COMPRESSION-001`.

### Minimal likely files

- `js/second-draft.js`
- `tests/regression.js`
- `data/second-draft-rules.json` only if an approved new behavior genuinely needs a new ID
- Engine architecture, rulebook, and changelog only to describe verified final behavior

### Acceptance criteria

- All Professional collocation fixtures are grammatical and preserve force.
- Already-professional ordinary wording remains unchanged.
- Direct, Shorter, repetition, notification, modality, recommendation, timing, and protected-value regressions remain green.
- Edit records describe exact final-output evidence.
- No other tone behavior changes.

### Rollback boundary

Revert only the Professional-specific matcher changes and their new fixtures/metadata. Do not alter shared phrase cleanup, `focusedMode`, Direct patterns, Length, Reflow, or SSML handoff in that cycle.

### Knowledge and invalidation questions

Capture whether sentence-level Professional patterns establish a reusable rule about purpose over vocabulary prestige. Recheck architecture, rulebook, engine changelog, published tone claims, audit findings, and any article examples after implementation.

## Proposed implementation order

1. **Professional:** remove the current unsafe grammar failures and establish no-change discipline.
2. **Concise:** separate tone responsibility from Shorter and Direct.
3. **Friendly:** replace reverse vocabulary prestige with bounded stiffness reduction.
4. **Natural:** clarify its minimal-change contract after the other lanes are distinct.

Direct remains the benchmark and should only reopen for new reproducible failures. Structure preservation and Expand grounding deserve separate bounded cycles rather than being hidden inside a tone repair.

## Knowledge decision and exact next step

This audit created reusable knowledge: **Yes**. Primary destination: `internal-documentation`. Durable artifact: this document. Workflow v2 does not require a new ledger item for this internal audit.

Does it justify an Engine Room article now? **Not yet—wait for the Professional implementation and verified regression results.**

After review, commit and push this audit separately. Then run one bounded Professional-only implementation cycle that removes or constrains unsafe broad substitutions, defines Professional through sentence-level purpose and clarity, adds approved fixtures, preserves every existing safety invariant, runs the invalidation scan, and captures the verified repair without waiting for an article.
