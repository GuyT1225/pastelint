# Journal analytics events

Journal link events use fixed editorial slugs through `data-statkit-event`. Analytics must remain optional: every link must work through its ordinary `href` without JavaScript or StatsKit.

## Event families

- `Journal Open | <article-slug>` — the primary article link on a current Journal card
- `Journal CTA | <article-slug> | <tool-or-action-slug>` — one genuine primary action already present in an article
- `Journal Related | <article-slug> | <destination-slug>` — article links in a designated related-reading section
- `Journal Media | <article-slug> | <media-destination>` — intentional external evidence, source, video, audio, or downloadable media
- `Journal Track | <track-slug>` — Journal index links to a track anchor

Slugs must be stable, lowercase, and kebab-case. Use editorial categories such as `reddit-source`, `youtube-demo`, `audio-example`, or `downloadable-checklist`; never place an arbitrary URL in an event.

## Privacy and exclusions

Event values must never contain pasted or selected text, tool input, generated output, document content, email addresses, phone numbers, query strings, user identifiers, or arbitrary destination URLs.

Do not track breadcrumbs, standard header or footer navigation, legal links, ordinary inline references, every tool-map link, or theme controls with established events. Do not invent a CTA or related-reading relationship to increase coverage.

## Publication checklist

For every Journal publication:

1. Add one Open event to its primary index-card link.
2. Add one CTA event only when the article has a genuine primary action.
3. Instrument designated related articles and meaningful external media or evidence.
4. Confirm all relative destinations and fragment links still work without analytics.
5. Include the complete event inventory in the implementation report.

Event totals measure recorded clicks. They are not automatically unique-user counts, conversion rates, or proof that one person completed a sequence.
