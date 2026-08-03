# Journal publication identity and sharing

This is the durable contract for publication identity and article-level sharing in the PasteLint Journal. It applies the editorial principles established by the [Editorial Constitution](editorial-constitution.md).

## Authorship by track

Authorship is determined by the manifest `track`, not by filename or source attribution.

| Track | Visible byline | Meta author | JSON-LD author |
| --- | --- | --- | --- |
| Engine Room | By Guy Teichman | Guy Teichman | `Person` / Guy Teichman |
| Sources & Case Studies | By Guy Teichman | Guy Teichman | `Person` / Guy Teichman |
| Editor's Desk | By PasteLint Editorial | PasteLint Editorial | `Organization` / PasteLint Editorial |

External creators remain sources, speakers, or subjects. They are not the author of the PasteLint article. The structured-data publisher is always `Organization` / PasteLint.

## Publication dates

For a new publication, the publication checkpoint is the source of truth. For a historical backfill, use the earliest Git commit that clearly made the article public: the page exists and the Journal index links to it, or equivalent strong repository evidence exists. Prefer the public page-and-card state over a later sitemap-only update. Never substitute source dates, capture dates, filesystem timestamps, the current maintenance date, or memory.

Visible dates use `Published Month Day, Year` in a semantic `<time datetime="YYYY-MM-DD">`. The manifest `published` date, visible time, `article:published_time`, and Article JSON-LD `datePublished` must agree. The manifest `modified` date, `article:modified_time`, Article JSON-LD `dateModified`, and sitemap `lastmod` must agree when the page changes.

### Historical backfill completed July 28, 2026

| Article | Publication date | Supporting commit | Evidence | Confidence |
| --- | --- | --- | --- | --- |
| `content-pipeline-breaks-before-writing` | 2026-07-21 | `27f809f` — feat: add content pipeline field note | Article, Journal card, and sitemap history | High |
| `cleanup-pass-voice-survives` | 2026-07-22 | `8c67343` — feat: add voice-preserving revision field note | Article, Journal card, and sitemap history | High |
| `tracing-with-the-model` | 2026-07-24 | `ff67404` — feat: add tracing field note | Article, Journal card, and sitemap history | High |
| `filler-openings` | 2026-07-24 | `9b2678a` — feat: add filler openings editor note | Article, Journal card, and sitemap history | High |
| `ssml-catalog-chunks` | 2026-07-24 | `a816db8` — feat: add SSML catalog chunking engine note | Article, Journal card, and sitemap history | High |

## Share control

Every published article has one restrained Share article control after its final substantive material and before related reading or closing navigation. It is a secondary action, not a product CTA. Drafts have no required public control.

`journal-share.js` reads the clean canonical link, the H1 or document title, and the meta description. It uses the native share sheet when `navigator.share` exists. Otherwise it copies the canonical URL with the Clipboard API or a basic selection fallback. It never adds query parameters, fragments, article text, user content, referrer data, or third-party share widgets.

The control remains a keyboard-accessible button with a visible label, decorative icon, focus treatment, and polite live status. Copy success announces `Link copied`; copy failure reports `Copy the address from your browser`. Native cancellation is quiet. Repeated activation is disabled only while an operation is pending.

## Analytics and privacy

Each published article declares exactly:

- `Journal Share | <article-slug> | native`
- `Journal Share | <article-slug> | copy-link`

The helper selects the applicable fixed `data-statkit-event` value at initialization. These are share-path activations. They do not prove completion, identify an application or recipient, demonstrate referral, or record cancellation details.

## Validator contract

The read-only validator requires published dates, the track-approved visible and structured author, PasteLint as publisher, aligned Open Graph and JSON-LD dates, one Article node, one share button, both fixed Share events, one live status, and one shared-helper inclusion. It preserves the ordinary-anchor contract for CTA, Related, and Media events.

Draft records keep `analytics.open` null; `analytics.cta`, `related`, `media`, and `share` empty; and `primaryCta` null. Draft dates may remain null.

## Maintenance checklist

1. Set manifest track, clean canonical, title, summary, publication date, and modified date.
2. Apply track authorship near the H1 and in meta/Article JSON-LD; keep PasteLint as publisher.
3. Add one Share control before related reading or closing navigation and include `journal-share.js` once.
4. Declare both fixed Share events in `analytics.share`; keep Share out of CTA analytics.
5. Align visible, Open Graph, JSON-LD, manifest, and sitemap dates.
6. Run the validator twice, regression tests, both share-path checks, and responsive/theme QA.
