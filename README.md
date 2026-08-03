# PasteLint

PasteLint is a browser-first text preparation suite for copied, drafted, generated, and speech-ready text.

It helps people clean structural noise, revise wording through bounded editorial rules, and prepare reviewed text for its next destination—without uploading the text to a processing service.

[Open PasteLint](https://guyt1225.github.io/pastelint/) · [Read the Journal](text-preparation-journal.html) · [Subscribe by RSS](journal.xml) · [Report an edge case](contact.html)

## Why PasteLint exists

Text rarely stays where it was written. It moves through documents, websites, email, prompts, publishing systems, speech tools, and accessibility workflows. Small formatting defects and careless revisions can become larger downstream problems.

PasteLint treats preparation as a distinct editorial step. The goal is greater usefulness without quietly changing what the text claims, requires, permits, implies, or leaves uncertain. Meaning matters more than generic polish, and transformations should remain reviewable.

## The workflow

**Paste → Clean → Revise → Prepare**

### Clean

Deterministic preparation for hidden characters, broken spacing, punctuation damage, copied line endings, repeated words, and related structural noise. Clean repairs transfer problems; it does not choose a tone or broadly rewrite meaning.

### Revise

Second Draft applies finite editorial patterns and user-selected tone, length, and structure options. Its safeguards are designed to preserve tested meaning, uncertainty, force, actors, conditions, and protected values. It is bounded revision, not open-ended generation or semantic summarization.

### Prepare

Reviewed text moves into destination-aware treatment for speech, SSML, publishing, documentation, email, websites, and other workflows. The current Second Draft handoff transfers the exact selected text to SSML Builder; later preparation remains explicit.

## What makes it different

PasteLint follows a small set of durable principles:

- Preserve meaning, uncertainty, force, attribution, and meaningful structure.
- Explain transformations only when the resulting evidence supports the explanation.
- Keep the user in control of editorial judgment and final wording.
- Keep Clean, Revise, and Prepare distinct.
- Prefer conservative preservation when a boundary is uncertain.
- Ground behavior and public claims in tests, provenance, and observed results.

PasteLint is not an AI writer, AI humanizer, detector-bypass system, cloud editor, grammar checker or subscription, note-taking application, or generic writing assistant.

## What you can do

| Tool or resource | Purpose |
| --- | --- |
| [PasteLint Clean](index.html) | Repair general paste artifacts, hidden characters, spacing, punctuation, and formatting noise. |
| [Clean ChatGPT Output](clean-chatgpt-output.html) | Prepare generated drafts with filler, inflated phrasing, rough spacing, or copy residue. |
| [Fix PDF Paste](fix-pdf-paste.html) | Repair hard line breaks and paragraph flow in text copied from PDFs. |
| [Remove Hidden Characters](remove-hidden-characters.html) | Remove zero-width characters, hard spaces, and invisible formatting residue. |
| [Clean Text Message](clean-text-message.html) | Prepare short messages, quick emails, and mobile drafts. |
| [Second Draft](second-draft.html) | Apply bounded revision options for tone, length, clarity, and structure. |
| [SSML Builder](SSML_builder.html) | Clean, review, escape, preview, chunk, and export speech-ready text and SSML. |
| [TTS Text Cleanup](tts-text-cleanup.html) | Prepare text before narration, read-aloud, TTS, or SSML use. |
| [IVR Text Prep](ivr-text-prep.html) | Prepare phone-menu copy, contact information, and public-service scripts. |
| [Text Readiness Framework](text-readiness-framework.html) | See how Paste, Clean, Revise, and Prepare fit together. |

## One editorial ecosystem

PasteLint is more than a set of isolated utilities. Its parts form one editorial system:

- **Clean** provides deterministic preparation and structural repair.
- **Second Draft** provides bounded, reviewable editorial revision.
- **SSML Builder** provides destination-aware speech and markup preparation.
- **Text Preparation Journal** publishes engine evidence, editorial principles, and research.
- **Editorial Constitution** defines the principles every part must preserve.
- **Codex Dispatch Standard** governs how repository implementation work is scoped, validated, and reported.

The product performs the work. The Journal explains what was learned. Governance documents keep future changes coherent.

## Text Preparation Journal

The [Text Preparation Journal](text-preparation-journal.html) is PasteLint's public record of editorial reasoning, engineering safeguards, research, and evidence. It is not a product-marketing blog.

Its departments have distinct roles:

- **Engine Room** documents product behavior, verification, limitations, and engineering lessons.
- **Editor's Desk** develops practical editorial principles without overstating product authority.
- **Sources & Case Studies** separates external evidence, observed cases, and interpretation.

The Journal is available as an [RSS feed](journal.xml). Published records are also checked against the repository manifest, metadata, analytics declarations, sitemap, and publication validator.

## Privacy and trust

PasteLint's current tools run in the browser with client-side JavaScript.

- No login is required.
- Text is pasted into the page rather than uploaded as a file.
- PasteLint has no backend text-processing service or model call.
- Pasted text is not sent to analytics; analytics are limited to basic site and fixed event usage.
- The public site is deployed as a static GitHub Pages project.

Local processing does not make every surrounding workflow private. Avoid placing confidential, client, medical, legal, personal, or sensitive text in public reports or GitHub issues. Review output before using it in factual, legal, medical, financial, professional, or sensitive communication.

See the [Privacy Policy](privacy.html) for the current implementation disclosure.

## Public resources

- [PasteLint on GitHub Pages](https://guyt1225.github.io/pastelint/)
- [Text Preparation Journal](text-preparation-journal.html)
- [Journal RSS feed](journal.xml)
- [GitHub repository](https://github.com/GuyT1225/pastelint)

## Documentation map

Start with the document that answers the question you have:

| Document | Authority |
| --- | --- |
| **README** | Public project identity, workflow, tools, and contributor orientation. |
| [Editorial Constitution](docs/editorial-constitution.md) | Highest-level authority for enduring editorial principles. |
| [Workflow v2](docs/workflow-v2.md) | Technical and knowledge lanes, checkpoints, destinations, and invalidation. |
| [Engine Architecture](docs/engine-architecture.md) | Current stage boundaries, behavior, safeguards, and limitations. |
| [Journal Publication Identity](docs/journal-publication-identity.md) | Authorship, dates, sharing, analytics declarations, and publication validation. |
| [Editorial Components v1](docs/editorial-components-v1.md) | Reusable evidence presentation, provenance, accessibility, and lifecycle rules. |
| [QA Checklist](QA_CHECKLIST.md) | Operational regression and browser checks. |
| [Codex Dispatch Standard](docs/codex-dispatch-standard.md) | Repository rehydration, implementation scope, validation, and return briefs. |

## Development

PasteLint is a static, framework-free HTML, CSS, and JavaScript project. There is no build step.

Serve it locally:

```powershell
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

Run the no-dependency regression suite:

```powershell
node tests/regression.js
```

Key implementation sources:

| File | Responsibility |
| --- | --- |
| [js/text-clean-engine.js](js/text-clean-engine.js) | Shared deterministic cleanup rules. |
| [js/text-analyzer.js](js/text-analyzer.js) | Shared findings and text analysis. |
| [js/second-draft.js](js/second-draft.js) | Bounded editorial revision pipeline. |
| [data/second-draft-rules.json](data/second-draft-rules.json) | Canonical Second Draft rule metadata and stable IDs. |
| [js/ssml-builder.js](js/ssml-builder.js) | Speech cleanup, escaping, preview, chunking, and export. |
| [tests/regression.js](tests/regression.js) | Regression protection for Clean, Second Draft, transfer, and SSML behavior. |

Development should remain browser-native, privacy-conscious, explainable, and conservative. Begin new engine work with a concrete failure fixture and preservation analysis; make small, reviewable changes; and claim only what validation demonstrates.

## Feedback and source signals

Use [GitHub Issues](https://github.com/GuyT1225/pastelint/issues) for repeatable bugs, broken links, cleanup edge cases, and technical reports. Friendly or nontechnical notes can go to `contact.pastelint@gmail.com`.

Useful reports identify the tool, input type, observed result, expected result, and a small anonymized example. Journal source signals should include the source link, what happened, why it appears to be a text-preparation problem, and any related tool.

Do not include confidential or sensitive text in a public report.

## License

TBD
