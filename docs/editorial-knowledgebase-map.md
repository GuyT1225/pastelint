# Editorial Knowledgebase Map

## 1. Executive summary

PasteLint already contains a practical editorial rule system. Some rules are explicit engine behavior, such as spacing cleanup, hidden-character recovery, PDF line-break repair, DB number expansion, SSML safety, and SecondDraft phrase rewrites. Other rules are product-facing principles visible in the pages and Journal, such as clean before rewrite, preserve ownership, make edits reviewable, and prepare text before it leaves the browser.

That rule system can become a public knowledgebase without turning the Journal into a generic writing blog. The strongest path is to publish short Editing Notes that explain the rule behind a cleanup problem, show one compact before/after example, and point to the relevant PasteLint tool. These notes should not reveal every implementation detail, and they should not claim PasteLint is an AI humanizer, detector bypass, or full writing assistant. The editorial angle is simpler and more defensible: copied, generated, exported, or drafted text needs a cleanup layer before it becomes useful.

The Text Preparation Journal can support two complementary tracks:

- Field Notes: source-led posts based on real examples, production failures, articles, and workflow signals.
- Editing Notes / Knowledgebase: rule-led posts that explain why specific cleanup and revision principles matter.

The first knowledgebase work should start with rules already obvious in the product: hidden characters, PDF line breaks, filler openings, long sentences, reviewable revision, speech punctuation, contact-info speech safety, and SSML chunking.

## 2. Observed product rules

### Rule 1: Normalize line endings

- Where observed: `js/text-clean-engine.js`, `normalizeLineEndings()`.
- What the rule appears to do: Converts Windows and old Mac line endings into normal newline characters.
- Why it matters for cleanup or revision: Mixed line endings can make pasted text inconsistent, harder to reflow, and less predictable in downstream tools.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 2: Remove hidden and non-breaking characters

- Where observed: `js/text-clean-engine.js`, `normalizeHiddenCharacterSpacing()` and `removeHiddenCharacters()`; `js/text-analyzer.js`, `detectHiddenCharacters()`.
- What the rule appears to do: Removes zero-width characters and byte-order marks, converts non-breaking spaces to normal spaces, and recovers a word boundary when a zero-width character sits between likely prose words.
- Why it matters for cleanup or revision: Invisible characters can break copy/paste workflows, merge visible words, or create confusing publishing and accessibility behavior.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 3: Preserve URL and email boundaries during hidden-character cleanup

- Where observed: `js/text-clean-engine.js`, `isUrlOrEmailBoundary()` and `shouldReplaceZeroWidthWithSpace()`.
- What the rule appears to do: Avoids inserting spaces around zero-width characters when the surrounding text looks like a URL, email, domain, or punctuation boundary.
- Why it matters for cleanup or revision: Hidden-character cleanup should not damage `help@example.org`, `www.example.org`, or similar tokens.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 4: Normalize mojibake quote and dash artifacts

- Where observed: `js/text-clean-engine.js`, `normalizeQuotes()` and `normalizeDashes()`; `js/ssml-builder.js`, `normalizeMojibakePunctuation()`.
- What the rule appears to do: Repairs visibly corrupted quote and dash characters caused by encoding problems.
- Why it matters for cleanup or revision: Broken punctuation makes text look unprofessional and can create poor speech or publishing output.
- Product surface: PasteLint Clean and SSML Builder.
- Confidence: High.

### Rule 5: Repair punctuation spacing without breaking times, numbers, URLs, or email

- Where observed: `js/text-clean-engine.js`, `normalizePunctuationSpacing()` and `isLikelyDomainOrEmailPeriod()`.
- What the rule appears to do: Removes spaces before punctuation, adds spaces after punctuation, and preserves time-like, decimal-like, URL-like, and email-like periods.
- Why it matters for cleanup or revision: Punctuation should become readable without corrupting useful technical tokens.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 6: Collapse excess spacing and blank lines

- Where observed: `js/text-clean-engine.js`, `normalizeSpacing()`; `js/text-analyzer.js`, `detectFormattingIssues()`.
- What the rule appears to do: Collapses repeated spaces and trims excessive blank lines while preserving paragraph breaks.
- Why it matters for cleanup or revision: Spacing noise makes copied text harder to scan, edit, or paste elsewhere.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 7: Correct common typos

- Where observed: `js/text-clean-engine.js`, `COMMON_TYPOS` and `fixCommonTypos()`; `js/script.js`, local typo repair fallback.
- What the rule appears to do: Replaces common misspellings such as `teh`, `recieve`, `seperate`, and `tommorow`, preserving capitalization where practical.
- Why it matters for cleanup or revision: Small obvious errors undermine trust in copied or generated text.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 8: Remove repeated words

- Where observed: `js/text-clean-engine.js`, `fixRepeatedWords()`; `js/script.js`, local repeated-word fallback.
- What the rule appears to do: Removes accidental duplicate adjacent words.
- Why it matters for cleanup or revision: Repeated words are common in pasted, dictated, or draft text and are easy to miss visually.
- Product surface: PasteLint Clean.
- Confidence: High.

### Rule 9: Detect filler phrases

- Where observed: `js/text-analyzer.js`, `detectFillerPhrases()`; `js/script.js`, `detectIssues()` and diagnostic rendering.
- What the rule appears to do: Flags phrases such as "it is important to note," "in today's world," "at the end of the day," and "with that being said."
- Why it matters for cleanup or revision: These phrases often pad generated copy and make text feel less direct.
- Product surface: PasteLint Clean and SecondDraft.
- Confidence: High.

### Rule 10: Detect long sentences

- Where observed: `js/text-analyzer.js`, `detectLongSentences()`; `js/script.js`, diagnostics; `js/second-draft.js`, `detectSecondDraftIssues()`.
- What the rule appears to do: Flags sentences above a word-count threshold as harder to read or hear aloud.
- Why it matters for cleanup or revision: Long sentences reduce readability and are especially risky for TTS, IVR, and accessibility workflows.
- Product surface: PasteLint Clean, SecondDraft, and SSML Builder.
- Confidence: High.

### Rule 11: Count words, sentences, paragraphs, and reading time

- Where observed: `js/text-analyzer.js`, `analyzeText()`; `js/script.js`, text brief rendering.
- What the rule appears to do: Produces basic text stats and estimated reading time.
- Why it matters for cleanup or revision: Users need lightweight status before deciding whether text is ready to copy, rewrite, or prepare for speech.
- Product surface: PasteLint Clean and SecondDraft.
- Confidence: High.

### Rule 12: Surface speech risks before they become audio problems

- Where observed: `js/text-analyzer.js`, `detectSpeechRisks()`; `js/text-clean-engine.js`, `detectCleanupWarnings()`; TTS and IVR pages.
- What the rule appears to do: Flags or normalizes slashes, ampersands, at signs, all-caps words, dash characters, and DB numbers when they may affect spoken output.
- Why it matters for cleanup or revision: Text that looks acceptable can still sound bad when read aloud.
- Product surface: PasteLint Clean, TTS Text Cleanup, IVR Text Prep, and SSML Builder.
- Confidence: High.

### Rule 13: Normalize symbols for spoken output only when speech mode asks for it

- Where observed: `js/text-clean-engine.js`, `normalizeSymbolsForSpeech()` and mode options in `js/script.js`.
- What the rule appears to do: Converts `&` to `and` and `@` to `at` when speech-oriented cleanup is enabled.
- Why it matters for cleanup or revision: Symbol cleanup is context-sensitive. A web URL or email may need preservation, while a script may need speech-safe wording.
- Product surface: PasteLint Clean, TTS Text Cleanup, IVR Text Prep.
- Confidence: High.

### Rule 14: Normalize DB catalog numbers for speech

- Where observed: `js/text-clean-engine.js`, `normalizeDbNumbers()`; `js/ssml-builder.js`, `formatDBs()` and catalog metadata functions.
- What the rule appears to do: Converts compact DB catalog numbers into digit-spaced speech-friendly forms.
- Why it matters for cleanup or revision: Catalog numbers can be misread by TTS if not separated.
- Product surface: SSML Builder, TTS Text Cleanup, IVR Text Prep.
- Confidence: High.

### Rule 15: Preserve reviewability through change maps

- Where observed: `js/text-clean-engine.js`, `changes`; `js/script.js`, edit map and visual preview rendering; `js/second-draft.js`, `edits`, `changes`, and review grid.
- What the rule appears to do: Tracks what changed and displays summaries or before/after edit details.
- Why it matters for cleanup or revision: Users should be able to inspect changes instead of trusting a polished result blindly.
- Product surface: PasteLint Clean and SecondDraft.
- Confidence: High.

### Rule 16: Reflow text into cleaner paragraphs

- Where observed: `js/script.js`, review mode and cleanup rendering; `js/second-draft.js`, `reflowSecondDraftParagraphs()`; PDF page copy and proof section.
- What the rule appears to do: Rejoins broken line flows and optionally reflows draft text into cleaner paragraph blocks.
- Why it matters for cleanup or revision: PDF and document paste often preserves visual layout instead of paragraph meaning.
- Product surface: PasteLint Clean and SecondDraft.
- Confidence: Medium.

### Rule 17: Rewrite filler openings into clearer sentences

- Where observed: `js/second-draft.js`, `applySecondDraftPatternRules()`.
- What the rule appears to do: Rewrites patterns such as "I just wanted to reach out and say that..." into a clearer sentence, with tone and length options affecting the result.
- Why it matters for cleanup or revision: Filler openings make generated or business copy feel padded and indirect.
- Product surface: SecondDraft.
- Confidence: High.

### Rule 18: Apply tone-specific phrase changes

- Where observed: `js/second-draft.js`, `applySecondDraftPhraseRules()`; `second-draft.html`, tone controls.
- What the rule appears to do: Applies phrase rules differently for direct, professional, friendly, natural, or concise tones.
- Why it matters for cleanup or revision: Revision should be controlled by the user instead of forcing one generic voice.
- Product surface: SecondDraft.
- Confidence: High.

### Rule 19: Apply length-specific revision options

- Where observed: `js/second-draft.js`, `applySecondDraftLengthRules()` and `expandSecondDraftText()`; `second-draft.html`, length controls.
- What the rule appears to do: Shortens by removing filler and weak wording, or expands with added context while attempting to preserve meaning.
- Why it matters for cleanup or revision: Users need different revision outcomes: tighter, same length, or expanded for context.
- Product surface: SecondDraft.
- Confidence: High.

### Rule 20: Preserve meaning and ownership

- Where observed: `second-draft.html` meta description; `journal-cleanup-pass-voice-survives.html`; `js/second-draft.js`, analysis brief instructions and "preserving meaning" copy in expansion.
- What the rule appears to do: Frames revision as a reviewable aid, not full voice replacement.
- Why it matters for cleanup or revision: Users need to keep final editorial control, especially with AI-assisted drafts.
- Product surface: SecondDraft and Journal.
- Confidence: Medium.

### Rule 21: Build an analysis brief from source material

- Where observed: `js/second-draft.js`, `buildAnalysisBrief()` and `prepareBriefSourceMaterial()`.
- What the rule appears to do: Converts raw text into a structured analysis brief with source material, goals, focus areas, output format, and instructions.
- Why it matters for cleanup or revision: Some text is not ready for rewriting; it first needs to become evidence for analysis.
- Product surface: SecondDraft.
- Confidence: High.

### Rule 22: Normalize contact information for speech

- Where observed: `js/ssml-builder.js`, `normalizeContactInfoForSpeech()`, `formatSpeechDomain()`, `formatSpeechEmailLocal()`, and `normalizeSocialHandlesForSpeech()`.
- What the rule appears to do: Converts emails, domains, and standalone social handles into speech-safe phrases.
- Why it matters for cleanup or revision: Contact information is easy for TTS systems to misread.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 23: Remove or rewrite characters unsafe for SSML

- Where observed: `js/ssml-builder.js`, `fixSpecialCharacters()`, `removeProblemCharacters()`, `removeLegalSymbols()`, and `escapeForSSML()`.
- What the rule appears to do: Removes legal symbols and problem characters, normalizes symbols, and escapes XML characters before wrapping SSML.
- Why it matters for cleanup or revision: Speech markup has stricter syntax than plain text.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 24: Normalize time abbreviations and ranges for TTS

- Where observed: `js/ssml-builder.js`, `normalizeTimeAbbreviations()` and `cleanSpacing()`.
- What the rule appears to do: Converts forms like `1pm`, `7 PM`, `10 a. m.`, and `1: 30 p. m.` into safer `1 p.m.` and `1:30 p.m.` forms; converts dash ranges into `to`.
- Why it matters for cleanup or revision: TTS may misread dotted or cramped time abbreviations.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 25: Preserve script sections and book-aware structure

- Where observed: `js/ssml-builder.js`, `splitRawIntoBookUnits()`, `looksLikeHeading()`, `formatHeading()`, `splitIntoBookAwareUnits()`, and `splitIntoBookAwareChunks()`.
- What the rule appears to do: Separates headings, book entries, and large chunks so long IVR/TTS scripts preserve structure.
- Why it matters for cleanup or revision: Large scripts must not merge unrelated sections or bury headings inside catalog entries.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 26: Normalize audiobook catalog metadata punctuation

- Where observed: `js/ssml-builder.js`, `normalizeCatalogMetadataPunctuation()` and `formatTalkingBookEntry()`.
- What the rule appears to do: Adds punctuation around title, DB number, duration, author, narrator, and source metadata when patterns are present.
- Why it matters for cleanup or revision: Catalog metadata needs punctuation cues to sound natural in audio.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 27: Chunk long SSML safely

- Where observed: `js/ssml-builder.js`, `CHARACTER_LIMIT`, `splitLongText()`, `splitIntoBookAwareChunks()`, and `generateChunks()`.
- What the rule appears to do: Splits large scripts into chunks near a 3000-character target, with book-aware handling and export support.
- Why it matters for cleanup or revision: Large TTS scripts need reviewable chunks before final audio generation.
- Product surface: SSML Builder.
- Confidence: High.

### Rule 28: Show empty-input status instead of silent failure

- Where observed: `js/script.js`, `handleClean()`; `js/ssml-builder.js`, empty action statuses; task pages with `#toolStatus`.
- What the rule appears to do: Shows messages like "Paste some text first." when users click actions with no meaningful input.
- Why it matters for cleanup or revision: Clear status prevents confusion and keeps the tool calm.
- Product surface: PasteLint Clean and SSML Builder.
- Confidence: High.

### Rule 29: Copy/export behavior should be explicit

- Where observed: `js/script.js`, `copyOutput()`; `js/second-draft.js`, `copySecondDraftOutput()`; `js/ssml-builder.js`, `copyText()` and `exportChunksZip()`.
- What the rule appears to do: Provides copy-ready output and status confirmation; SSML chunks can be exported.
- Why it matters for cleanup or revision: The workflow ends when the user can move cleaned or prepared text into the next system.
- Product surface: All three.
- Confidence: High.

### Rule 30: Text should be prepared before leaving the browser

- Where observed: `index.html`, `text-readiness-framework.html`, `privacy.html`, Journal pages, and footer copy.
- What the rule appears to do: Positions PasteLint as local preparation before publishing, speaking, documenting, analyzing, or pasting elsewhere.
- Why it matters for cleanup or revision: This is the product doctrine that ties the tools together.
- Product surface: All three.
- Confidence: High.

## 3. Rule clusters

### Formatting noise

- Problem it solves: Copied text contains encoding artifacts, extra spaces, broken punctuation, mixed line endings, and stray symbols.
- Product surfaces: PasteLint Clean, Clean ChatGPT Output, Fix PDF Paste, Remove Hidden Characters, TTS Text Cleanup, IVR Text Prep.
- Why users should care: Formatting noise makes text look less professional and can create downstream publishing or accessibility issues.

### AI-style filler

- Problem it solves: Generated drafts often include padded openings, generic transitions, and weak stock phrases.
- Product surfaces: Clean ChatGPT Output, PasteLint Clean diagnostics, SecondDraft.
- Why users should care: Removing filler makes the text easier to review before the user decides whether to rewrite or send it.

### Clarity and plain language

- Problem it solves: Long sentences, vague phrasing, inflated wording, and weak next steps make text harder to use.
- Product surfaces: PasteLint Clean diagnostics, SecondDraft, Text Readiness Framework.
- Why users should care: Clearer text reduces editing load and makes the final human decision easier.

### Paragraph structure

- Problem it solves: PDF and document copy often preserves visual line layout instead of paragraph flow.
- Product surfaces: Fix PDF Paste, PasteLint Clean, SecondDraft reflow.
- Why users should care: Paragraph structure determines whether text feels readable and reusable.

### Revision control

- Problem it solves: A polished rewrite can hide what changed.
- Product surfaces: SecondDraft edit map, PasteLint review panels, Journal field note on voice preservation.
- Why users should care: Revision should create reviewable choices, not replace user judgment.

### Voice preservation

- Problem it solves: AI-assisted revision can flatten authorship when changes are invisible.
- Product surfaces: SecondDraft, Journal note `journal-cleanup-pass-voice-survives.html`.
- Why users should care: Users need to keep ownership of final wording.

### Speech readiness

- Problem it solves: Text that scans visually can sound wrong in TTS, IVR, or screen-reader workflows.
- Product surfaces: TTS Text Cleanup, IVR Text Prep, SSML Builder, analyzer speech risks.
- Why users should care: Spoken text needs punctuation, contact-info handling, and chunking that plain writing tools often ignore.

### Accessibility/readability

- Problem it solves: Hidden characters, long sentences, symbols, and layout artifacts can make text harder to read or hear.
- Product surfaces: PasteLint Clean, TTS Text Cleanup, SSML Builder, Text Readiness Framework.
- Why users should care: Accessibility starts before publishing, narration, or automation.

### Source-to-output trust

- Problem it solves: Users need to know what changed and why before copying output onward.
- Product surfaces: Text Brief, What PasteLint Found, Edit Map, Visual Cleanup Preview, SecondDraft review grid, SSML status messages.
- Why users should care: Trust comes from visible review, not a black-box result.

## 4. Knowledgebase article candidates

1. **Why hidden characters can merge words**
   - Article type: Engine Note.
   - Rule cluster: Formatting noise.
   - Source from product logic: `normalizeHiddenCharacterSpacing()` and hidden-character diagnostics.
   - User problem: Text looks normal but copies, publishes, or searches incorrectly.
   - Why this matters for generated copy: AI and web workflows can carry invisible formatting from one surface to another.
   - Example before/after idea: `text[zero-width]has` becomes `text has`; email remains intact.
   - Related PasteLint tool links: Remove Hidden Characters, PasteLint Clean.
   - Priority: High.

2. **PDF line breaks are layout, not paragraphs**
   - Article type: Editing Note.
   - Rule cluster: Paragraph structure.
   - Source from product logic: PDF cleanup mode, PDF page proof, paragraph reflow behavior.
   - User problem: PDF copy becomes short broken lines.
   - Why this matters for generated copy: Copied source material may be fed into AI or publishing tools before it is readable.
   - Example before/after idea: A three-line PDF paragraph becomes one paragraph.
   - Related PasteLint tool links: Fix PDF Paste, PasteLint Clean.
   - Priority: High.

3. **Filler openings make AI drafts feel unfinished**
   - Article type: Editing Note.
   - Rule cluster: AI-style filler.
   - Source from product logic: `detectFillerPhrases()` and `applySecondDraftPatternRules()`.
   - User problem: Drafts start with padded phrases like "I just wanted to reach out."
   - Why this matters for generated copy: Filler can make generated copy sound generic even when the idea is useful.
   - Example before/after idea: "I just wanted to reach out..." becomes a direct sentence.
   - Related PasteLint tool links: Clean ChatGPT Output, SecondDraft.
   - Priority: High.

4. **Clean first, rewrite second**
   - Article type: Editing Note.
   - Rule cluster: Source-to-output trust.
   - Source from product logic: Homepage suite model, SecondDraft next steps, Text Readiness Framework.
   - User problem: Users send messy text straight to rewrite tools.
   - Why this matters for generated copy: Cleanup removes noise before revision choices happen.
   - Example before/after idea: Clean formatting first, then choose a SecondDraft tone.
   - Related PasteLint tool links: PasteLint Clean, SecondDraft.
   - Priority: High.

5. **Long sentences become listening fatigue**
   - Article type: Editing Note.
   - Rule cluster: Accessibility/readability.
   - Source from product logic: `detectLongSentences()`, analyzer messages, TTS page.
   - User problem: Text reads fine silently but becomes hard to follow aloud.
   - Why this matters for generated copy: AI drafts often produce smooth but overlong sentences.
   - Example before/after idea: One long sentence split into two reviewable sentences.
   - Related PasteLint tool links: TTS Text Cleanup, SecondDraft.
   - Priority: High.

6. **Why reviewable edits protect voice**
   - Article type: Editing Note.
   - Rule cluster: Revision control.
   - Source from product logic: SecondDraft edit map, Journal field note on voice survival.
   - User problem: A rewrite looks polished but loses the writer's intent.
   - Why this matters for generated copy: AI-assisted revision should leave the final choice with the writer.
   - Example before/after idea: Show one phrase-level edit with a reason.
   - Related PasteLint tool links: SecondDraft, Text Preparation Journal.
   - Priority: High.

7. **When punctuation is an audio instruction**
   - Article type: Editing Note.
   - Rule cluster: Speech readiness.
   - Source from product logic: SSML time, catalog, DB, and Read by punctuation rules.
   - User problem: TTS reads a visually acceptable script badly.
   - Why this matters for generated copy: Generated scripts often need speech-specific punctuation before audio.
   - Example before/after idea: `1 p. m.` becomes `1 p.m.`; `Title DB...` gains commas and periods.
   - Related PasteLint tool links: SSML Builder, TTS Text Cleanup.
   - Priority: High.

8. **Contact information needs speech-safe formatting**
   - Article type: Engine Note.
   - Rule cluster: Speech readiness.
   - Source from product logic: `normalizeContactInfoForSpeech()`, domain/email/handle rules.
   - User problem: Emails, websites, and social handles are misread aloud.
   - Why this matters for generated copy: Scripts frequently include contact details copied from websites or event listings.
   - Example before/after idea: `help@example.org` becomes speech-safe domain wording.
   - Related PasteLint tool links: SSML Builder, IVR Text Prep.
   - Priority: High.

9. **A cleanup pass is not a humanizer**
   - Article type: Editing Note.
   - Rule cluster: Source-to-output trust.
   - Source from product logic: Clean ChatGPT proof note, Text Readiness Framework anti-humanizer positioning.
   - User problem: People confuse cleanup with detector bypass or automatic voice replacement.
   - Why this matters for generated copy: The safer frame is review, cleanup, and final human editing.
   - Example before/after idea: Remove filler, then leave final voice decision to the user.
   - Related PasteLint tool links: Clean ChatGPT Output, SecondDraft.
   - Priority: High.

10. **Why blank lines matter more than they look**
    - Article type: Engine Note.
    - Rule cluster: Formatting noise.
    - Source from product logic: `normalizeSpacing()` and analyzer excess line-break detection.
    - User problem: Copied text has awkward blank gaps that survive into email, docs, or scripts.
    - Why this matters for generated copy: Formatting artifacts make drafts feel less reliable.
    - Example before/after idea: Multiple blank lines become one paragraph break.
    - Related PasteLint tool links: PasteLint Clean, Clean Text Message.
    - Priority: Medium.

11. **DB numbers are not ordinary numbers**
    - Article type: Engine Note.
    - Rule cluster: Speech readiness.
    - Source from product logic: DB number normalization in clean engine and SSML Builder.
    - User problem: Catalog numbers are mispronounced or rushed by TTS.
    - Why this matters for generated copy: Library and accessibility scripts have domain-specific metadata.
    - Example before/after idea: `DB134037` becomes `DB 1-3-4-0-3-7`.
    - Related PasteLint tool links: SSML Builder, TTS Text Cleanup.
    - Priority: Medium.

12. **Why text stats are not vanity metrics**
    - Article type: Editing Note.
    - Rule cluster: Accessibility/readability.
    - Source from product logic: analyzer stats and Text Brief.
    - User problem: Users need a quick sense of size and complexity before editing.
    - Why this matters for generated copy: AI output can feel polished while being longer than needed.
    - Example before/after idea: Same idea, fewer words, easier review.
    - Related PasteLint tool links: PasteLint Clean, SecondDraft.
    - Priority: Medium.

13. **The difference between formatting cleanup and revision**
    - Article type: Editing Note.
    - Rule cluster: Revision control.
    - Source from product logic: Text Readiness Framework stages and Clean to SecondDraft paths.
    - User problem: Users expect one button to solve formatting and writing at once.
    - Why this matters for generated copy: Cleanup and rewriting are different editorial decisions.
    - Example before/after idea: Clean spacing first; then revise wording separately.
    - Related PasteLint tool links: PasteLint Clean, SecondDraft.
    - Priority: Medium.

14. **Why SSML needs chunks before final audio**
    - Article type: Engine Note.
    - Rule cluster: Speech readiness.
    - Source from product logic: `CHARACTER_LIMIT`, chunking functions, export behavior.
    - User problem: Long scripts become hard to review and may exceed practical engine limits.
    - Why this matters for generated copy: Long generated or compiled scripts need safe review units.
    - Example before/after idea: One long script split into numbered chunks.
    - Related PasteLint tool links: SSML Builder.
    - Priority: Medium.

15. **Copy-ready output is the real finish line**
    - Article type: Editing Note.
    - Rule cluster: Source-to-output trust.
    - Source from product logic: copy buttons, copied statuses, output counters, chunk export.
    - User problem: Text preparation only matters if the result can move cleanly into the next workflow.
    - Why this matters for generated copy: Drafts often need to leave one tool and enter another system.
    - Example before/after idea: Clean, review, copy, then paste into the final destination.
    - Related PasteLint tool links: PasteLint Clean, SSML Builder, SecondDraft.
    - Priority: Medium.

16. **Analysis briefs are a form of text preparation**
    - Article type: Engine Note.
    - Rule cluster: Source-to-output trust.
    - Source from product logic: `buildAnalysisBrief()` in SecondDraft.
    - User problem: Raw notes are not always ready to rewrite; sometimes they need structure for analysis.
    - Why this matters for generated copy: Source material should be evidence before it becomes advice.
    - Example before/after idea: Raw paste becomes a structured analysis brief.
    - Related PasteLint tool links: SecondDraft.
    - Priority: Medium.

17. **Speech cleanup is not audio generation**
    - Article type: Editing Note.
    - Rule cluster: Speech readiness.
    - Source from product logic: TTS/IVR pages and SSML status messages telling users to review before final Polly audio.
    - User problem: Users may expect a prep tool to generate or validate audio.
    - Why this matters for generated copy: TTS workflows need reviewed text before audio, not hidden automation.
    - Example before/after idea: Script text becomes speech-prepared text.
    - Related PasteLint tool links: TTS Text Cleanup, IVR Text Prep, SSML Builder.
    - Priority: Medium.

18. **Source signals make cleanup lessons credible**
    - Article type: Field Note.
    - Rule cluster: Source-to-output trust.
    - Source from product logic: Journal index and field note format.
    - User problem: Generic writing advice lacks proof.
    - Why this matters for generated copy: Real workflows reveal where cleanup breaks.
    - Example before/after idea: Source signal, cleanup problem, tool path.
    - Related PasteLint tool links: Text Preparation Journal.
    - Priority: Low.

## 5. Recommended first 5 Editing Notes

### 1. PDF line breaks are layout, not paragraphs

- Thesis: PDF paste problems usually come from copied visual layout, not bad writing.
- Outline:
  1. What PDF copy preserves.
  2. Why hard line breaks are not paragraph intent.
  3. How reflow makes text easier to review.
  4. When to send cleaned text to SecondDraft.
- Before/after example idea: A public-event paragraph broken across several lines becomes two clean paragraphs.
- Related tool: Fix PDF Paste.
- Why it should be published early: It is the clearest high-intent cleanup problem and now has a compact proof section.

### 2. Filler openings make AI drafts feel unfinished

- Thesis: Generic openings and transition phrases are often the first thing to clean before judging a generated draft.
- Outline:
  1. Why filler hides the useful point.
  2. Common phrases PasteLint flags or rewrites.
  3. Cleanup versus rewrite.
  4. Let the user make the final edit.
- Before/after example idea: "I just wanted to reach out..." becomes a direct sentence.
- Related tool: Clean ChatGPT Output and SecondDraft.
- Why it should be published early: It supports current GSC interest in ChatGPT cleanup without drifting into humanizer language.

### 3. Why hidden characters can merge words

- Thesis: Invisible characters are dangerous because they create visible failures only after text moves downstream.
- Outline:
  1. What zero-width and non-breaking characters are.
  2. Why deleting them can accidentally merge words.
  3. Why URLs and emails need special handling.
  4. How to review cleaned output.
- Before/after example idea: `text[zero-width]has` becomes `text has`; `help[zero-width]@example.org` stays intact.
- Related tool: Remove Hidden Characters.
- Why it should be published early: It explains a product-quality fix and a memorable cleanup pain point.

### 4. Reviewable edits protect voice

- Thesis: Revision is safer when the user can see what changed before accepting it.
- Outline:
  1. Why polished output can hide tradeoffs.
  2. What edit maps do.
  3. How tone and length controls keep the user in charge.
  4. Why this is not voice replacement.
- Before/after example idea: A phrase edit shown with a reason.
- Related tool: SecondDraft.
- Why it should be published early: It connects the first voice-preservation Field Note to a durable knowledgebase principle.

### 5. When punctuation is an audio instruction

- Thesis: In TTS and IVR workflows, punctuation tells the voice system how to breathe.
- Outline:
  1. Why visual punctuation is not always speech-safe.
  2. Times, DB numbers, contact info, and catalog metadata.
  3. Why review before final audio matters.
  4. Where SSML Builder fits.
- Before/after example idea: `10 a. m. to 1: 30 p. m.` becomes `10 a.m. to 1:30 p.m.`
- Related tool: SSML Builder, TTS Text Cleanup, IVR Text Prep.
- Why it should be published early: It highlights PasteLint's strongest specialized workflow.

## 6. Journal architecture recommendation

The Journal should remain one index page for now, with clearer tracks inside it:

1. **Field Notes**
   - Source-led.
   - Built from real signals, articles, Reddit posts, workflow failures, or production issues.
   - Current examples: content pipeline note and voice-preservation note.

2. **Editing Notes / Knowledgebase**
   - Rule-led.
   - Based on observed PasteLint and SecondDraft behavior.
   - Each note should explain one cleanup/revision principle, show one example, and link to a tool.

3. **Engine Notes**
   - Optional future subtrack.
   - Use only when a technical rule is interesting to users, such as hidden-character boundary recovery or SSML time normalization.
   - Keep implementation detail high-level and user-facing.

Recommendation: keep all tracks on `text-preparation-journal.html` until there are at least six to eight total notes. After that, consider separate index pages only if the page becomes hard to scan. The first architecture patch should add a small "Editing Notes" section to the Journal index rather than creating a second index too early.

## 7. Risks

### Risk: Becoming too generic

- Problem: The knowledgebase could turn into broad writing advice.
- Mitigation: Every note must cite a product rule, tool behavior, field signal, or production failure.

### Risk: Revealing too much implementation detail

- Problem: Engine Notes could expose brittle regex details or make PasteLint feel mechanical.
- Mitigation: Explain principles and examples, not exact implementation patterns.

### Risk: Sounding like AI writing advice

- Problem: ChatGPT cleanup topics can slide into generic prompt or AI writing content.
- Mitigation: Frame notes around preparation, cleanup, review, and final human editing.

### Risk: Overlapping with humanizer/detector-bypass markets

- Problem: AI cleanup can attract the wrong audience.
- Mitigation: Continue saying PasteLint is not a humanizer or detector bypass when necessary, and avoid "undetectable" claims.

### Risk: Publishing too many notes too quickly

- Problem: A large knowledgebase without source signals could feel thin.
- Mitigation: Publish one Editing Note at a time and connect each to one tool or field note.

### Risk: Diluting the source-led Journal

- Problem: Editing Notes could bury Field Notes.
- Mitigation: Keep the tracks visually distinct and label them clearly.

### Risk: Overpromising cleanup behavior

- Problem: Articles could imply exact engine output.
- Mitigation: Use "helps," "flags," "surfaces," and "example direction" unless the output is verified.

### Risk: Turning SecondDraft into a black-box rewrite promise

- Problem: Knowledgebase posts might make SecondDraft sound like an AI assistant.
- Mitigation: Emphasize reviewable edits, tone/length controls, and preserved user choice.

## 8. Recommended next implementation

Highest-priority next step: **Add a small Editing Notes section to the Journal index.**

Why this one:

- It creates a home for knowledgebase articles without publishing a rushed article immediately.
- It clarifies the Journal architecture while preserving the existing Field Notes track.
- It can link to planned notes without pretending they already exist, or it can introduce the track with one short paragraph and no new article links yet.
- It keeps the implementation surgical and avoids production behavior changes.

Suggested scope:

- File likely involved: `text-preparation-journal.html`.
- Optional CSS only if the existing Journal cards cannot support a compact track section.
- Copy direction: "Editing Notes explain the cleanup and revision rules behind PasteLint and SecondDraft: hidden characters, filler phrases, paragraph repair, reviewable edits, and speech-ready punctuation."
- Do not add generic writing-blog language.
- Do not add AI humanizer or detector-bypass positioning.
- Do not add backend/API/login features.

