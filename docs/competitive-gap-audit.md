# PasteLint Competitive Gap Audit

## 1. Executive read

PasteLint is strongest where most competitors are blurry: it is not just a text cleaner, not a writing assistant, and not an AI humanizer. It has a coherent privacy-first text-preparation model: clean broken pasted text, revise when needed, and prepare the result for publishing, speech, prompts, documents, or another system.

Observed strengths include the browser-only/no-upload promise, the Clean -> SecondDraft -> SSML Builder suite model, unusually specific speech-prep tooling, source-led Journal positioning, and a quiet editorial visual language that avoids generic AI SaaS styling.

The easiest competitor attack is not technical. It is clarity and proof. A competitor could ship narrower pages with stronger examples, sample buttons, visible before/after galleries, and better beginner onboarding. PasteLint has the deeper strategy, but some pages still ask users to infer the proof instead of seeing it immediately.

Most worth fixing next: create stronger source/example proof around the highest-intent task pages, especially PDF paste cleanup and Clean ChatGPT Output. These should stay small, browser-only, and proof-led.

## 2. What PasteLint already owns well

### Privacy and trust

Observed:

- `privacy.html` clearly states local browser processing, no login, no upload, no backend account, and no AI API call for core tools.
- Footer language repeats: "No login. No upload. Everything runs in your browser."
- StatsKit disclosure exists in `privacy.html` and says analytics are page-level only, not pasted text.
- Tool pages consistently include the no-upload privacy posture without turning it into legal boilerplate.

Why it matters:

Generic text utilities and AI writing tools often blur privacy boundaries. PasteLint's no-upload claim is a defensible wedge because the user is frequently pasting rough, private, or operational text.

### Browser-only workflow

Observed:

- Shared local cleanup behavior lives in `js/text-clean-engine.js`, `js/text-analyzer.js`, and `js/script.js`.
- SecondDraft uses `js/second-draft.js`.
- SSML Builder uses `js/ssml-builder.js`.
- The site is static HTML/CSS/JS with no visible backend dependency.

Why it matters:

This makes PasteLint easier to trust for small tasks than cloud writing tools, PDF converters, or account-based editors.

### Specific tool categories

Observed pages:

- `index.html`: core PasteLint Clean workflow.
- `clean-chatgpt-output.html`: AI-output cleanup without detector-bypass framing.
- `fix-pdf-paste.html`: no-upload copied-PDF cleanup.
- `remove-hidden-characters.html`: invisible character cleanup.
- `tts-text-cleanup.html` and `ivr-text-prep.html`: speech-prep bridges.
- `SSML_builder.html`: dedicated SSML preparation and chunking.
- `second-draft.html`: local rewrite/refinement stage.

Why it matters:

The suite covers a real chain of adjacent work rather than a random tool directory.

### Editorial positioning

Observed:

- `text-readiness-framework.html` gives PasteLint a strategic model: Clean, Rewrite, Prepare, Publish.
- `text-preparation-journal.html` and the field notes use source-led framing instead of generic SEO article language.
- Journal pages include source signal panels, field-note labels, and practical readiness checklists.

Why it matters:

This gives PasteLint authority without fake polish. A competitor can copy a tool box faster than they can copy a credible editorial point of view.

### Journal/source-led authority

Observed:

- `journal-content-pipeline-breaks-before-writing.html` is based on a Reddit source signal.
- `journal-cleanup-pass-voice-survives.html` is based on an OpenAI Academy article.
- `contact.html` now points users to GitHub issues and invites source-signal suggestions while warning against sending private text.

Why it matters:

The Journal can become a defensible "why this problem exists" layer that competitors with generic text tools rarely have.

### SSML/IVR specialization

Observed:

- `SSML_builder.html` supports cleaning, generating SSML, chunking, and copying outputs.
- `tests/regression.js` includes large OTBS script cleanup, DB number handling, social handle normalization, time abbreviation fixes, phone/email/domain behavior, XML escaping, and chunking safety.

Why it matters:

This is PasteLint's sharpest functional wedge. Most text-cleaner competitors do not care about speech production. Most SSML/vendor tools do not care about messy pasted scripts before markup.

### Visual/design differentiation

Observed:

- Light/Dark/Terminal themes.
- Journal pages have a warm editorial paper surface in Light theme.
- Proof/check sections use sharper rules and restrained review-sheet styling.

Why it matters:

The product feels more like an editorial workbench than a generic AI landing page.

### No-upload promise

Observed:

- Repeated across footer, privacy, task pages, and Journal copy.
- The promise is specific: no login, no upload, local browser behavior.

Why it matters:

This is a practical trust feature, not just a brand line.

## 3. Where PasteLint is vulnerable

### Positioning gaps

#### Gap: The "text preparation" category is strong but still needs concrete proof.

- What is missing or unclear: New users may understand "clean text" faster than "text preparation."
- Why it matters: Competitors can win by being more instantly obvious.
- How a competitor could exploit it: A simple "fix copied PDF line breaks" page with one obvious before/after could convert faster.
- Severity: High.
- Recommended next move: Keep the framework, but attach more visible before/after proof to the task pages.

#### Gap: The homepage has many suite concepts for a first-time visitor.

- What is missing or unclear: Clean, SecondDraft, SSML Builder, Text Readiness, Journal, and task pages all compete as mental models.
- Why it matters: Users arriving with a single pain may not care about the platform story yet.
- How a competitor could exploit it: Offer a single-purpose page with fewer decisions.
- Severity: Medium.
- Recommended next move: Do not remove the suite. Add clearer "start here if..." routes and compact examples.

### Product/tool gaps

#### Gap: Few sample text buttons.

- What is missing or unclear: Users must bring messy text before they see the magic.
- Why it matters: Sample inputs reduce friction and make screenshots/demos repeatable.
- How a competitor could exploit it: Use "try example" buttons to show instant value.
- Severity: High.
- Recommended next move: Add one carefully scoped sample button on one high-intent page first, likely `fix-pdf-paste.html` or `clean-chatgpt-output.html`.

#### Gap: Before/after examples are not consistently first-class.

- What is missing or unclear: Some pages explain cleanup, but not all show a concrete transformation before interaction.
- Why it matters: Transformation is the product.
- How a competitor could exploit it: Use side-by-side examples as the hero proof.
- Severity: High.
- Recommended next move: Add compact example proof blocks after the tool, not broad FAQ/SEO blocks.

#### Gap: SecondDraft is rule-based and may be weaker than AI rewrite tools.

- What is missing or unclear: Rewrite quality has an inherent ceiling without model intelligence.
- Why it matters: Users comparing against Grammarly, Wordtune, or AI chat tools may expect deeper prose judgment.
- How a competitor could exploit it: Claim better tone, rewrite quality, or extension workflows.
- Severity: Medium.
- Recommended next move: Strengthen transparency: show what SecondDraft is best for, add examples, and expand regression fixtures.

### UX/onboarding gaps

#### Gap: The tool suite has strong routes, but not enough "which tool should I use?" guidance.

- What is missing or unclear: Users may not know whether to use PasteLint Clean, SecondDraft, TTS cleanup, or SSML Builder.
- Why it matters: Confusion makes broad competitors feel easier.
- How a competitor could exploit it: Provide a simple picker by use case.
- Severity: Medium.
- Recommended next move: Add a compact "choose your next step" section to the framework or homepage, not a new dashboard.

#### Gap: Empty states are improving, but examples remain sparse.

- What is missing or unclear: Empty inputs now give status messages, but empty proof states do not always teach.
- Why it matters: Empty UI should lower anxiety.
- How a competitor could exploit it: Use friendly examples and one-click demos.
- Severity: Medium.
- Recommended next move: Add example snippets to demo docs first, then one production sample control.

### SEO/GEO gaps

#### Gap: High-intent pages can be more snippet-ready.

- What is missing or unclear: Some pages have good titles/meta, but the first 100-150 words could answer the exact task more directly.
- Why it matters: Search and generative answers reward concise task definitions.
- How a competitor could exploit it: Publish tightly scoped pages like "Remove PDF line breaks without upload."
- Severity: High.
- Recommended next move: Strengthen one page at a time with plain task answer + proof, starting with PDF or ChatGPT cleanup.

#### Gap: Journal pages are good authority assets but not yet tightly connected to search task pages.

- What is missing or unclear: Journal insights link to tools, but task pages do not always surface relevant field notes.
- Why it matters: Internal linking can create topical authority without SEO filler.
- How a competitor could exploit it: Build content hubs that route readers to tools.
- Severity: Medium.
- Recommended next move: Add selective "related field note" links on relevant task pages after more notes exist.

### Trust/proof gaps

#### Gap: Users cannot easily verify the no-upload claim from the UI.

- What is missing or unclear: Privacy copy is clear, but there is no simple "how this works" trust explainer page.
- Why it matters: Privacy-first users may want proof, not just claims.
- How a competitor could exploit it: Publish transparent architecture/trust docs.
- Severity: Medium.
- Recommended next move: Add a small "How PasteLint works" trust page or a section in `privacy.html`, with no legal bloat.

#### Gap: StatsKit analytics is disclosed, but some privacy-sensitive users may still wonder what is tracked.

- What is missing or unclear: The disclosure says page-level analytics only; it does not say how to avoid sending pasted text to analytics beyond the general promise.
- Why it matters: Analytics can create perceived tension with "everything stays in browser."
- How a competitor could exploit it: Claim "no analytics" or "fully offline."
- Severity: Low.
- Recommended next move: Keep disclosure plain. Consider a short FAQ-style line in Privacy only if questions arise.

### Conversion/contact gaps

#### Gap: Contact is GitHub-issue-based and may be too developer-shaped for casual source-signal contributors.

- What is missing or unclear: Non-developers may not want to open GitHub issues.
- Why it matters: Journal source signals may come from non-technical users.
- How a competitor could exploit it: Provide a simple form or email.
- Severity: Low/Medium.
- Recommended next move: Do not add backend/forms yet. Consider GitHub issue templates first.

### Mobile gaps

#### Gap: Some advanced tool flows may feel dense after cleanup on mobile.

- What is missing or unclear: Buttons, proof panels, post-clean actions, and diagnostics can stack heavily.
- Why it matters: Mobile users want fast paste-clean-copy.
- How a competitor could exploit it: Provide a lighter mobile-only flow.
- Severity: Medium.
- Recommended next move: Continue mobile QA page by page, especially SSML and SecondDraft.

### Accessibility/readability gaps

#### Gap: Theme controls and dense proof sections could use continued accessibility review.

- What is missing or unclear: Source inspection shows semantic labels in many places, but no dedicated accessibility audit exists in docs.
- Why it matters: PasteLint serves accessibility-adjacent workflows; accessibility debt would be brand-inconsistent.
- How a competitor could exploit it: Claim accessible/editorial-grade UI.
- Severity: Medium.
- Recommended next move: Run a focused accessibility QA pass after the current content sprint.

### Technical/content architecture gaps

#### Gap: `internal-marker.html` is intentionally unlinked/noindex but still present as a static page.

- What is missing or unclear: It is for analytics marking and should stay out of public discovery.
- Why it matters: If accidentally indexed or linked, it looks strange.
- How a competitor could exploit it: Not a meaningful attack, but it can look unpolished if discovered.
- Severity: Low.
- Recommended next move: Keep noindex/nofollow and out of sitemap/nav/footer.

#### Gap: There is an untracked file named `"tatus --short"` in the working tree.

- What is missing or unclear: It appears to be an accidental local artifact, not a product file.
- Why it matters: It can confuse audits and commits.
- How a competitor could exploit it: They cannot; this is local hygiene.
- Severity: Low.
- Recommended next move: Remove it in a separate cleanup if confirmed unwanted.

## 4. Competitor attack map

| Competitor type | What they would claim | Where PasteLint is stronger | Where PasteLint is weaker | Best defensive move |
|---|---|---|---|---|
| Generic online text cleaners | "Paste text and clean it instantly." | Stronger privacy story, suite model, proof/report language, cleaner design. | They can be simpler and rank for many tiny utility queries. | Add compact examples and sample buttons on high-intent pages. |
| AI humanizers / AI rewriting tools | "Make AI text sound human and pass detection." | PasteLint avoids risky evasion framing and keeps trust. | They may capture high-volume anxiety searches. | Do not chase them; keep "clean before send/publish" framing. |
| Grammar and style editors | "Improve clarity, grammar, and tone everywhere." | Browser-only, no account, no cloud rewrite, stronger preparation model. | They have stronger rewrite engines, extensions, and familiar UX. | Make SecondDraft more transparent and proof-led. |
| PDF line-break cleanup tools | "Remove PDF line breaks fast." | No-upload positioning plus routing to rewrite and prep. | They can be more narrowly obvious. | Add PDF before/after proof and maybe one sample input. |
| TTS / SSML preparation tools | "Generate or validate speech markup." | PasteLint owns messy-script preflight before SSML. | Vendor docs/tools have official authority and real audio engines. | Emphasize preflight, chunking, and vendor caveats. |
| Prompt cleanup / AI workflow tools | "Clean prompts and AI outputs for better workflows." | PasteLint has practical cleanup plus Journal authority. | Prompt tools may feel more directly AI-native. | Show prompt/output cleanup examples without becoming a prompt marketplace. |
| Privacy-first browser utilities | "Everything runs locally." | PasteLint has a broader workflow and better editorial positioning. | Some may be simpler or fully offline/no analytics. | Keep privacy copy crisp and transparent about analytics. |
| Content workflow / editorial QA tools | "Manage publishing consistency and editorial quality." | PasteLint is lightweight and specific to text preparation. | They may have collaboration, checklists, calendars, and workflows. | Use Journal + readiness checklists to own the preflight layer, not project management. |

## 5. Page-by-page gap notes

### `index.html`

- Current role: Main PasteLint Clean tool and suite entry.
- Strongest element: H1 and immediate paste-first workflow.
- Weakest element: First-time users may still need a more concrete example of "what copy/paste broke."
- One surgical improvement: Add one unobtrusive sample input or before/after proof strip.
- Timing: Do soon.

### `clean-chatgpt-output.html`

- Current role: High-intent task page for cleaning AI-generated text before reuse.
- Strongest element: Clear query alignment without humanizer/detector-bypass language.
- Weakest element: Could show more visible proof of what changes before users paste.
- One surgical improvement: Add a compact "what this cleans" example with filler/spacing/inflated wording.
- Timing: Do next or soon.

### `second-draft.html`

- Current role: Local revision/refinement stage after cleanup.
- Strongest element: Fits the suite model as the rewrite stage.
- Weakest element: Competes against much stronger AI/grammar rewriting tools.
- One surgical improvement: Add clearer edit transparency/examples rather than promising AI-level rewrite quality.
- Timing: Do soon.

### `SSML_builder.html`

- Current role: Browser-only SSML preparation and chunking workbench.
- Strongest element: Deep speech-prep specialization and regression coverage.
- Weakest element: Non-technical users may not understand boundaries: it prepares markup, not audio.
- One surgical improvement: Add a concise compatibility/caveat note and one reviewed script example.
- Timing: Do soon.

### `fix-pdf-paste.html`

- Current role: No-upload repair for text copied from PDFs.
- Strongest element: Very clear pain point and strong privacy wedge.
- Weakest element: Needs stronger visible before/after proof.
- One surgical improvement: Add a compact PDF broken-lines example near the tool.
- Timing: Do next.

### `remove-hidden-characters.html`

- Current role: Remove invisible formatting and strange spaces.
- Strongest element: Narrow problem with strong trust value.
- Weakest element: Invisible problems are hard to understand without named proof.
- One surgical improvement: Add a small "what this catches" proof panel with zero-width/nonbreaking examples, without dumping Unicode jargon.
- Timing: Do soon.

### `tts-text-cleanup.html`

- Current role: Prepare text before read-aloud/TTS use.
- Strongest element: Strong bridge to SSML Builder.
- Weakest element: May still feel like generic cleanup plus speech copy.
- One surgical improvement: Add a read-aloud before/after example with dates, symbols, or long sentences.
- Timing: Do soon.

### `ivr-text-prep.html`

- Current role: Prepare phone menu and IVR scripts.
- Strongest element: Specific production niche and SSML handoff.
- Weakest element: Needs more concrete menu/contact proof.
- One surgical improvement: Add one IVR menu example showing phone/domain cleanup direction.
- Timing: Do soon.

### `text-readiness-framework.html`

- Current role: Explains the Clean -> Rewrite -> Prepare -> Publish model.
- Strongest element: Gives the suite a strategic foundation.
- Weakest element: Can feel abstract without enough concrete examples.
- One surgical improvement: Add one concise example per stage or link each stage to a live field note/tool.
- Timing: Later, after more Journal notes.

### `text-preparation-journal.html`

- Current role: Source-led editorial authority hub.
- Strongest element: Distinctive research/artifact feel and published note cards.
- Weakest element: Still young; two notes are not yet a full authority library.
- One surgical improvement: Add categories or filters only after there are enough notes.
- Timing: Leave alone for now.

### `journal-content-pipeline-breaks-before-writing.html`

- Current role: Field note on content pipeline consistency.
- Strongest element: Strong source panel and concrete metrics from the provided source.
- Weakest element: The connection to specific PasteLint tools is useful but still inferential.
- One surgical improvement: Later, link this note from relevant content/AI pages.
- Timing: Later.

### `journal-cleanup-pass-voice-survives.html`

- Current role: Field note on AI-assisted revision preserving authorship.
- Strongest element: Clear authorship/reviewability principle.
- Weakest element: Could eventually benefit from an example of visible revision comparison.
- One surgical improvement: Later, connect from `second-draft.html`.
- Timing: Later.

### `contact.html`

- Current role: Feedback, issue reporting, and Journal source-signal path.
- Strongest element: Direct GitHub issue/repo links and private-text warning.
- Weakest element: GitHub may be too technical for some users.
- One surgical improvement: Add GitHub issue templates before adding forms or email.
- Timing: Do soon if source-signal submissions matter.

### `privacy.html`

- Current role: Public trust and privacy explanation.
- Strongest element: Local processing and analytics disclosure are clear.
- Weakest element: Users cannot verify implementation from the page.
- One surgical improvement: Add a tiny "how local processing works" explanation or link to repo.
- Timing: Later.

## 6. Missing pages or missing sections

| Suggestion | Why it matters | Risk of adding it | Worth doing now? |
|---|---|---|---|
| Examples / before-after gallery | Makes transformation visible and reusable for demos, search, and social. | Can become generic SEO filler if too broad. | Yes, but start small. |
| Source signal submission template | Makes Journal contributions easier while avoiding private text. | GitHub-only path may deter non-technical users. | Soon. |
| GitHub issue templates | Low-maintenance way to guide bugs, source signals, and feature suggestions. | Slightly developer-centric. | Soon. |
| Use-case pages | Could target credible search families like PDF, TTS, IVR, ChatGPT cleanup. | Easy to overproduce thin pages. | Only when backed by examples/signals. |
| "How PasteLint works" trust page | Helps users verify no-upload/no-backend claims. | Can become too technical. | Later, or add to Privacy first. |
| Changelog | Builds credibility for active improvement. | Requires upkeep. | Later. |
| FAQ | Answers objections. | High risk of SEO filler. | Not now. |
| Comparison pages | Could clarify positioning vs humanizers or PDF converters. | High risk of looking combative/thin. | Not now. |
| Field note index improvements | Becomes useful as notes grow. | Premature with only a few notes. | Later. |
| Tool-specific examples | Improves conversion and trust. | Must avoid clutter above the tool. | Yes, one page at a time. |

## 7. SEO and GEO opportunities

### Credible query families

- clean pasted text
- clean ChatGPT output
- fix text copied from PDF
- remove hidden characters
- remove weird spaces from text
- prepare text for TTS
- IVR script cleanup
- SSML builder / SSML editor
- browser-only text cleaner
- no-upload PDF text cleanup
- revise AI text without losing voice

### Existing pages to strengthen

- `fix-pdf-paste.html`: best candidate for before/after proof.
- `clean-chatgpt-output.html`: strong impressions likely, needs visible proof and anti-humanizer clarity.
- `SSML_builder.html`: should own "SSML editor" and "TTS/IVR prep" through examples.
- `second-draft.html`: should connect with the voice-preserving revision Journal note.
- `remove-hidden-characters.html`: can own hidden-character symptoms if it explains downstream failures.

### New pages that may be justified

- A narrow examples gallery if each example maps to an existing tool.
- A source-signal submission guide/template.
- A "How PasteLint works" trust explainer.

### Pages that should not be created yet

- AI humanizer pages.
- Detector-bypass pages.
- Generic "best writing tools" pages.
- Broad comparison pages without real tested comparisons.
- Dozens of thin SEO pages for every punctuation or whitespace query.

### Internal linking opportunities

- Link `journal-cleanup-pass-voice-survives.html` from `second-draft.html`.
- Link `journal-content-pipeline-breaks-before-writing.html` from `clean-chatgpt-output.html` or the framework only if the context feels natural.
- Add relevant Journal links to task pages after there are enough notes to avoid overlinking.

### Structured answer opportunities

- "What does PasteLint do?"
- "What does browser-only mean?"
- "How do I clean copied PDF text without uploading a file?"
- "How do I prepare text for TTS/SSML?"
- "How do I revise AI-assisted writing without losing voice?"

Keep these answers task-based and visible in the page body, not stuffed into FAQ blocks by default.

## 8. Product gaps

| Feature | Impact | Effort | Risk | Do now? |
|---|---|---|---|---|
| Sample text button on PDF page | High: instant proof. | Low/Medium. | Low if one page only. | Yes. |
| Sample text button on Clean ChatGPT page | High: demonstrates anti-slop cleanup. | Low/Medium. | Medium due humanizer-adjacent framing. | Soon. |
| Before/after examples | High: makes transformation tangible. | Low. | Low if compact. | Yes. |
| Better diagnostic explanations | Medium: improves trust after cleanup. | Medium. | Medium if it clutters UI. | Soon. |
| Field-note-to-tool pathways | Medium: connects authority to action. | Low. | Low if selective. | Later. |
| Better empty states with examples | Medium: helps new users. | Low. | Low. | Soon. |
| Stronger source-signal capture | Medium: grows Journal moat. | Low. | Low/Medium if GitHub-only. | Soon. |
| Local download/export | Medium for SSML/chunks. | Medium. | Low if local-only. | Later; SSML already has export behavior. |
| More transparent SecondDraft change notes | High for trust. | Medium. | Medium. | Soon. |

## 9. Trust gaps

### Where the promise is strong

- Footer repeats no login/no upload/browser.
- `privacy.html` explains local processing and analytics.
- Tool pages consistently avoid upload/API claims.
- Journal pages avoid requesting private pasted text and Contact warns against sensitive/private submissions.

### Where it may be underexplained

- The UI says text stays local, but most users cannot verify how.
- StatsKit appears on all public pages and is disclosed, but users may not know what "page-level analytics" excludes.
- `internal-marker.html` is intentionally private/noindex but should remain out of sitemap and navigation.

### StatsKit copy mismatch risk

Low. The privacy page says analytics are for page-level usage only and pasted text is not sent. This matches the visible StatsKit install pattern. The risk is perception, not observed code behavior.

### Is no-upload repeated enough?

Yes. It may even be near the upper limit. The next trust move should be proof/explanation, not more repetition.

### Can users verify what happens to pasted text?

Partly. The repository is public and Contact links to it, but there is no user-friendly "how it works" explanation. A small trust explainer could help.

## 10. Prioritized roadmap

### Do next

1. **PDF before/after proof**
   - Reason: Highest clarity, high-intent use case, clear competitor pressure.
   - Files likely involved: `fix-pdf-paste.html`, possibly `css/styles.css`.
   - Expected impact: Better first-session conversion.
   - Risk level: Low.

2. **Clean ChatGPT proof cue**
   - Reason: Strong query fit, but humanizer-adjacent searches are noisy.
   - Files likely involved: `clean-chatgpt-output.html`.
   - Expected impact: Better clarity and CTR without risky positioning.
   - Risk level: Low/Medium.

3. **SecondDraft + voice field-note link**
   - Reason: The new Journal note naturally supports reviewable revision.
   - Files likely involved: `second-draft.html`.
   - Expected impact: Stronger suite coherence and authorship positioning.
   - Risk level: Low.

4. **GitHub issue templates**
   - Reason: Contact now points to GitHub; templates can guide useful reports/source signals.
   - Files likely involved: `.github/ISSUE_TEMPLATE/*`.
   - Expected impact: Better feedback quality.
   - Risk level: Low.

5. **Remove accidental local artifact**
   - Reason: `"tatus --short"` appears to be a stray file.
   - Files likely involved: local deletion only after confirmation.
   - Expected impact: Cleaner repo hygiene.
   - Risk level: Low.

### Do soon

1. Hidden-character proof panel.
2. IVR phone/menu example.
3. SSML vendor caveat and example script.
4. TTS read-aloud example.
5. SecondDraft regression fixture expansion.
6. Framework examples for each stage.
7. Small "How PasteLint works" trust section or page.
8. Examples gallery seeded from `docs/pastelint-demo-copy-bank.md`.

### Park for later

1. Comparison pages.
2. Broad FAQ system.
3. Changelog.
4. Large navigation redesign.
5. Account-based collaboration.
6. Backend/API features.
7. AI model rewrite integration.
8. Detector/humanizer content.

## 11. Red flags

- Do not weaken browser-only/no-upload positioning.
- Do not chase AI detector-bypass or humanizer traffic.
- Do not turn the Journal into generic content marketing.
- Do not add upload-based PDF workflows.
- Do not add accounts, login, backend, or API just to look more SaaS-like.
- Do not overbuild navigation while the current suite model is still working.
- Do not make SSML Builder claim to generate or validate audio.
- Do not add broad SEO pages without source signals or concrete examples.
- Do not bury the tools under editorial content.

## 12. Final recommendation

Defend the browser-only text-preparation wedge. That is PasteLint's moat: private, local, practical cleanup before text enters another system.

Improve the proof layer. A smart competitor would not beat PasteLint by having a better philosophy; they would beat it by making the first transformation more obvious in three seconds. Add compact examples, sample inputs, and before/after proof to the highest-intent pages.

Ignore the tempting wrong lanes: AI humanizer SEO, detector bypass, broad writing assistant claims, upload-based PDF conversion, accounts, and generic content volume. PasteLint is strongest when it behaves like a calm editorial workbench, not a noisy AI product.
